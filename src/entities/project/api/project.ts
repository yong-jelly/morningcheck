import { supabase } from "@/shared/lib/supabase";
import type { Project } from "../model/types";
import { getCurrentDateString, getYesterdayDateString } from "@/shared/lib/utils";

/**
 * DB에서 가져온 프로젝트 데이터를 애플리케이션의 Project 타입으로 변환합니다.
 * @param p DB에서 가져온 로우 데이터
 * @returns 변환된 Project 객체
 */
export const mapProjectFromDb = (p: any): Project => {
  // 오늘과 어제 날짜 문자열 가져오기 (통계 계산용)
  const today = getCurrentDateString();
  const yesterday = getYesterdayDateString();

  // 해당 날짜의 통계 데이터 추출
  const todayStats = p.stats?.find((s: any) => s.stats_date === today);
  const yesterdayStats = p.stats?.find((s: any) => s.stats_date === yesterday);

  // 모든 체크인 데이터를 최신순으로 정렬하여 마지막 체크인 정보 추출
  const sortedCheckIns = [...(p.check_ins || [])].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestCheckIn = sortedCheckIns[0];
  let lastCheckInInfo = null;

  if (latestCheckIn) {
    // 마지막 체크인을 수행한 멤버 정보 찾기
    const member = p.members?.find((m: any) => m.user_id === latestCheckIn.user_id);
    lastCheckInInfo = {
      userDisplayName: member?.user?.display_name || "익명",
      userAvatarUrl: member?.user?.avatar_url,
      checkInTime: latestCheckIn.created_at
    };
  }

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    iconType: p.icon_type,
    inviteCode: p.invite_code,
    visibilityType: p.visibility_type,
    // 멤버 데이터 매핑
    members: (p.members || []).map((m: any) => ({ 
      id: m.user_id, 
      name: m.user?.display_name || "익명",
      profileImageUrl: m.user?.avatar_url 
    })),
    // 체크인 데이터 매핑
    checkIns: (p.check_ins || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      date: c.check_in_date,
      condition: c.condition,
      note: c.note,
      createdAt: c.created_at
    })),
    // 초대 데이터 매핑
    invitations: (p.invitations || []).map((i: any) => ({
      id: i.id,
      projectId: i.project_id,
      inviterId: i.inviter_id,
      email: i.invitee_email,
      status: i.status,
      invitedAt: i.invited_at,
      respondedAt: i.responded_at
    })),
    // 참여 요청 데이터 매핑
    joinRequests: (p.join_requests || []).map((r: any) => ({
      id: r.id,
      projectId: r.project_id,
      userId: r.user_id,
      status: r.status,
      requestedAt: r.requested_at,
      processedAt: r.processed_at,
      processedBy: r.processed_by,
      rejectionReason: r.rejection_reason
    })),
    // 통계 정보 계산 및 매핑
    stats: {
      memberCount: todayStats?.member_count ?? (p.members || []).length,
      checkInCount: todayStats?.check_in_count ?? (p.check_ins || []).filter((c: any) => c.check_in_date === today).length,
      avgCondition: todayStats?.avg_condition ?? (
        (p.check_ins || []).filter((c: any) => c.check_in_date === today).length > 0
          ? (p.check_ins || []).filter((c: any) => c.check_in_date === today).reduce((acc: number, curr: any) => acc + curr.condition, 0) / (p.check_ins || []).filter((c: any) => c.check_in_date === today).length
          : 0
      ),
      participationRate: todayStats?.participation_rate ?? (
        (p.members || []).length > 0
          ? Math.round(((p.check_ins || []).filter((c: any) => c.check_in_date === today).length / (p.members || []).length) * 100)
          : 0
      ),
      // 전일 대비 멤버 수 변화량
      memberCountChange: yesterdayStats ? (todayStats?.member_count ?? (p.members || []).length) - yesterdayStats.member_count : 0
    },
    lastCheckIn: lastCheckInInfo,
    createdBy: p.created_by,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    deletedAt: p.deleted_at,
    archivedAt: p.archived_at,
  };
};

export const projectApi = {
  /**
   * 새로운 프로젝트를 생성합니다.
   * @param projectData 프로젝트 생성에 필요한 데이터
   * @returns 생성된 프로젝트 데이터
   */
  async createProject(projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "deletedAt" | "members" | "checkIns">) {
    const { data, error } = await supabase.rpc("v1_create_project", {
      p_name: projectData.name,
      p_description: projectData.description,
      p_icon: projectData.icon,
      p_icon_type: projectData.iconType,
      p_invite_code: projectData.inviteCode,
      p_visibility_type: projectData.visibilityType,
      p_created_by: projectData.createdBy,
    });

    if (error) throw error;
    return data;
  },

  /**
   * 프로젝트 정보를 업데이트합니다.
   * @param projectId 프로젝트 ID
   * @param updates 업데이트할 필드들
   * @returns 업데이트된 프로젝트 데이터
   */
  async updateProject(projectId: string, updates: Partial<Omit<Project, "id" | "createdAt" | "updatedAt" | "deletedAt" | "visibilityType">>) {
    const { data, error } = await supabase.rpc("v1_update_project", {
      p_project_id: projectId,
      p_name: updates.name,
      p_description: updates.description,
      p_icon: updates.icon,
      p_icon_type: updates.iconType,
    });

    if (error) throw error;
    return data;
  },

  /**
   * 사용자를 프로젝트 멤버로 직접 참여시킵니다 (Public 프로젝트용).
   * @param projectId 프로젝트 ID
   * @param userId 사용자 ID
   */
  async joinProject(projectId: string, userId: string) {
    const { error } = await supabase.rpc("v1_join_project", {
      p_project_id: projectId,
      p_user_id: userId,
    });

    if (error) throw error;
  },

  /**
   * 프로젝트 참여 요청을 보냅니다 (Request 기반 프로젝트용).
   * @param projectId 프로젝트 ID
   * @param userId 사용자 ID
   */
  async requestToJoin(projectId: string, userId: string) {
    const { error } = await supabase.rpc("v1_request_to_join", {
      p_project_id: projectId,
      p_user_id: userId,
    });

    if (error) throw error;
  },

  /**
   * 특정 사용자의 특정 프로젝트에 대한 참여 요청 상태를 가져옵니다.
   * @param projectId 프로젝트 ID
   * @param userId 사용자 ID
   * @returns 참여 요청 데이터 (있는 경우)
   */
  async getJoinRequest(projectId: string, userId: string) {
    const { data, error } = await supabase.rpc("v1_get_join_request", {
      p_project_id: projectId,
      p_user_id: userId,
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  /**
   * 전체 공개 또는 요청 기반 프로젝트 목록을 가져옵니다.
   * 본인이 멤버이거나 생성자인 경우 비공개 프로젝트도 포함합니다.
   * @param authId 현재 로그인한 사용자의 ID (비공개 프로젝트 조희용)
   * @returns 프로젝트 리스트 (멤버, 체크인, 통계 정보 포함)
   */
  async getPublicProjects(authId?: string) {
    const { data, error } = await supabase.rpc("v1_get_public_projects", {
      p_auth_id: authId
    });

    if (error) throw error;
    return data;
  },

  /**
   * ID를 통해 특정 프로젝트의 상세 정보를 가져옵니다.
   * @param projectId 프로젝트 ID
   * @param authId 사용자 ID (아카이브된 프로젝트 조회용)
   * @returns 프로젝트 상세 데이터
   */
  async getProjectById(projectId: string, authId?: string) {
    const { data, error } = await supabase.rpc("v1_get_project_by_id", {
      p_project_id: projectId,
      p_auth_id: authId,
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  /**
   * 프로젝트 아이콘 이미지를 스토리지에 업로드합니다.
   * @param file 이미지 파일
   * @param userId 사용자 ID (폴더 구조용)
   * @returns 업로드된 이미지의 공개 URL
   */
  async uploadProjectIcon(file: File, userId: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("mmcheck-project-icons")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("mmcheck-project-icons")
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * 프로젝트를 소프트 삭제합니다 (deleted_at 필드 업데이트).
   * @param projectId 프로젝트 ID
   */
  async softDeleteProject(projectId: string) {
    const { error } = await supabase.rpc("v1_soft_delete_project", {
      p_project_id: projectId,
    });

    if (error) throw error;
  },

  /**
   * 프로젝트를 아카이브합니다 (archived_at 필드 업데이트).
   * @param projectId 프로젝트 ID
   */
  async archiveProject(projectId: string) {
    const { error } = await supabase.rpc("v1_archive_project", {
      p_project_id: projectId,
    });

    if (error) throw error;
  },

  /**
   * 아카이브된 프로젝트를 복원합니다 (archived_at 필드를 NULL로 업데이트).
   * @param projectId 프로젝트 ID
   */
  async restoreProject(projectId: string) {
    const { error } = await supabase.rpc("v1_restore_project", {
      p_project_id: projectId,
    });

    if (error) throw error;
  },

  /**
   * 프로젝트에 체크인을 기록합니다.
   * @param projectId 프로젝트 ID
   * @param userId 사용자 ID
   * @param condition 컨디션 점수 (1-10)
   * @param note 오늘의 한 줄 평
   * @returns 생성된 체크인 데이터
   */
  async checkIn(projectId: string, userId: string, condition: number, note: string) {
    const { data, error } = await supabase.rpc("v1_check_in", {
      p_project_id: projectId,
      p_user_id: userId,
      p_condition: condition,
      p_note: note,
    });

    if (error) throw error;
    return data;
  },

  /**
   * 체크인 기록을 삭제(취소)합니다.
   * @param checkInId 체크인 ID
   */
  async cancelCheckIn(checkInId: string) {
    const { error } = await supabase.rpc("v1_cancel_check_in", {
      p_check_in_id: checkInId,
    });

    if (error) throw error;
  },

  /**
   * 프로젝트에서 탈퇴합니다 (소프트 삭제).
   * @param projectId 프로젝트 ID
   * @param userId 사용자 ID
   */
  async leaveProject(projectId: string, userId: string) {
    const { error } = await supabase.rpc("v1_leave_project", {
      p_project_id: projectId,
      p_user_id: userId,
    });

    if (error) throw error;
  },

  /**
   * 프로젝트 초대를 수락합니다.
   * @param projectId 프로젝트 ID
   * @param userId 사용자 ID
   * @param invitationId 초대 ID
   */
  async acceptInvitation(projectId: string, userId: string, invitationId: string) {
    const { error } = await supabase.rpc("v1_accept_invitation", {
      p_invitation_id: invitationId,
      p_project_id: projectId,
      p_user_id: userId,
    });

    if (error) throw error;
  },

  /**
   * 사용자의 대기 중인 초대 내역을 가져옵니다.
   * @param email 사용자 이메일
   * @param projectId 프로젝트 ID (선택)
   * @returns 초대 리스트
   */
  async getPendingInvitations(email: string, projectId?: string) {
    const { data, error } = await supabase.rpc("v1_get_pending_invitations", {
      p_email: email,
      p_project_id: projectId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * 프로젝트에 멤버를 초대하고 히스토리를 기록합니다.
   * @param projectId 프로젝트 ID
   * @param inviterId 초대자 ID
   * @param email 초대받을 사람의 이메일
   */
  async inviteMember(projectId: string, inviterId: string, email: string) {
    const { data, error } = await supabase.rpc("v1_invite_member", {
      p_project_id: projectId,
      p_inviter_id: inviterId,
      p_invitee_email: email,
    });

    if (error) throw error;
    return data;
  },

  /**
   * 프로젝트 초대를 취소하고 히스토리를 기록합니다.
   * @param invitationId 초대 ID
   * @param actorId 취소자 ID
   */
  async cancelInvitation(invitationId: string, actorId: string) {
    const { error } = await supabase.rpc("v1_cancel_invitation", {
      p_invitation_id: invitationId,
      p_actor_id: actorId,
    });

    if (error) throw error;
  },

  /**
   * 프로젝트의 모든 초대/참여 히스토리를 조회합니다.
   * @param projectId 프로젝트 ID
   */
  async getInvitationHistory(projectId: string) {
    const { data, error } = await supabase.rpc("v1_get_invitation_history", {
      p_project_id: projectId,
    });

    if (error) throw error;
    return data;
  },
};
