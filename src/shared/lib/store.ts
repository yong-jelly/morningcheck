import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Project, CheckIn } from "@/entities/project/model/types";

interface AppState {
  /** 현재 로그인한 사용자 정보 */
  currentUser: User | null;
  /** 인증 여부 (로그인 상태) */
  isAuthenticated: boolean;
  /** 사용자가 참여 중이거나 관리 중인 프로젝트 목록 */
  projects: Project[];
  /** 현재 선택되어 활성화된 프로젝트 ID */
  currentProjectId: string | null;
  /** 날씨 정보 (온도, 날씨 코드) */
  weather: { temp: number; code: number } | null;
  
  // Actions
  /**
   * 사용자 로그인을 처리합니다.
   * @param user 로그인할 사용자 정보
   */
  login: (user: User) => void;
  /** 사용자 로그아웃을 처리하고 상태를 초기화합니다. */
  logout: () => void;
  /**
   * 현재 사용자의 프로필 정보를 업데이트합니다.
   * @param profile 업데이트할 프로필 정보 조각
   */
  updateProfile: (profile: Partial<User>) => void;
  /**
   * 현재 사용자 정보를 강제로 설정합니다.
   * @param user 설정할 사용자 정보 또는 null
   */
  setCurrentUser: (user: User | null) => void;
  /**
   * 새로운 프로젝트를 목록에 추가하고 현재 프로젝트로 설정합니다.
   * @param project 추가할 프로젝트 정보
   */
  addProject: (project: Project) => void;
  /**
   * 현재 활성화된 프로젝트 ID를 설정합니다.
   * @param id 프로젝트 ID 또는 null
   */
  setCurrentProjectId: (id: string | null) => void;
  /**
   * 특정 프로젝트에 새로운 체크인 기록을 추가합니다.
   * @param projectId 프로젝트 ID
   * @param checkIn 추가할 체크인 데이터
   */
  addCheckIn: (projectId: string, checkIn: CheckIn) => void;
  /**
   * 특정 프로젝트의 체크인 기록을 삭제합니다.
   * @param projectId 프로젝트 ID
   * @param checkInId 삭제할 체크인 ID
   */
  removeCheckIn: (projectId: string, checkInId: string) => void;
  /**
   * 초대 코드를 사용하여 프로젝트에 참여합니다.
   * @param inviteCode 프로젝트 초대 코드
   * @param user 참여할 사용자 정보
   * @returns 참여 성공 여부
   */
  joinProject: (inviteCode: string, user: User) => boolean;
  /**
   * 프로젝트의 정보를 업데이트합니다.
   * @param projectId 프로젝트 ID
   * @param updates 업데이트할 프로젝트 정보 조각
   */
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  /**
   * 프로젝트에 멤버를 초대합니다.
   * @param projectId 프로젝트 ID
   * @param email 초대할 멤버의 이메일
   */
  inviteMember: (projectId: string, email: string) => void;
  /**
   * 프로젝트 초대를 수락하고 멤버로 추가합니다.
   * @param projectId 프로젝트 ID
   * @param user 수락한 사용자 정보
   */
  acceptInvitation: (projectId: string, user: User) => void;
  /**
   * 보낸 초대를 취소하거나 삭제합니다.
   * @param projectId 프로젝트 ID
   * @param invitationId 삭제할 초대 ID
   */
  removeInvitation: (projectId: string, invitationId: string) => void;
  /**
   * 프로젝트에서 특정 멤버를 제거합니다.
   * @param projectId 프로젝트 ID
   * @param userId 제거할 사용자의 ID
   */
  removeMember: (projectId: string, userId: string) => void;
  /**
   * 전체 프로젝트 목록을 설정하거나 업데이터 함수를 통해 갱신합니다.
   * @param projects 새 프로젝트 목록 또는 기존 목록을 인자로 받는 업데이터 함수
   */
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  /** 날씨 정보를 설정합니다. */
  setWeather: (weather: { temp: number; code: number } | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- 초기 상태 ---
      currentUser: null,
      isAuthenticated: false,
      projects: [],
      currentProjectId: null,
      weather: null,

      // --- 인증 관련 액션 ---
      login: (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: () => set({ currentUser: null, isAuthenticated: false, currentProjectId: null }),
      
      updateProfile: (profile) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...profile } : null
      })),

      setCurrentUser: (user) => set({ currentUser: user }),
      
      // --- 프로젝트 관리 액션 ---
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project],
        currentProjectId: project.id 
      })),

      setCurrentProjectId: (id) => set({ currentProjectId: id }),

      // --- 체크인 관련 액션 ---
      addCheckIn: (projectId, checkIn) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, checkIns: [...p.checkIns, checkIn] }
            : p
        )
      })),

      removeCheckIn: (projectId, checkInId) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, checkIns: p.checkIns.filter((c) => c.id !== checkInId) }
            : p
        )
      })),

      // --- 멤버 및 초대 관리 액션 ---
      joinProject: (inviteCode, user) => {
        const { projects } = get();
        const project = projects.find((p) => p.inviteCode === inviteCode);
        
        if (project) {
          // 이미 멤버인지 확인하여 중복 추가 방지
          const isAlreadyMember = project.members.some((m) => m.id === user.id);
          if (!isAlreadyMember) {
            set((state) => ({
              projects: state.projects.map((p) => 
                p.inviteCode === inviteCode 
                  ? { ...p, members: [...p.members, user] }
                  : p
              ),
              currentProjectId: project.id
            }));
          } else {
            // 이미 멤버인 경우 현재 프로젝트 ID만 전환
            set({ currentProjectId: project.id });
          }
          return true;
        }
        return false;
      },

      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId ? { ...p, ...updates } : p
        )
      })),

      inviteMember: (projectId, email) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { 
                ...p, 
                invitations: [
                  ...(p.invitations || []), 
                  { 
                    id: crypto.randomUUID(), 
                    projectId,
                    inviterId: state.currentUser?.id || "",
                    email, 
                    status: "pending", 
                    invitedAt: new Date().toISOString() 
                  }
                ] 
              } 
            : p
        )
      })),

      acceptInvitation: (projectId, user) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { 
                ...p, 
                members: [...p.members, user],
                invitations: p.invitations?.map((i) => 
                  i.email === user.email ? { ...i, status: "accepted", acceptedAt: new Date().toISOString() } : i
                )
              } 
            : p
        )
      })),

      removeInvitation: (projectId, invitationId) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, invitations: p.invitations?.filter((i) => i.id !== invitationId) }
            : p
        )
      })),

      removeMember: (projectId, userId) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, members: p.members.filter((m) => m.id !== userId) }
            : p
        )
      })),

      // --- 데이터 동기화 액션 ---
      setProjects: (projectsOrUpdater) => set((state) => ({ 
        projects: typeof projectsOrUpdater === 'function' 
          ? projectsOrUpdater(state.projects) 
          : projectsOrUpdater 
      })),

      setWeather: (weather) => set({ weather })
    }),
    {
      name: "morningcheck-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
