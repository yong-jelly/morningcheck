-- =====================================================
-- 021_v1_accept_invitation.sql
-- 초대를 수락하고 멤버로 등록하는 함수
-- 
-- 인자:
--   @p_invitation_id: 초대 ID
--   @p_project_id: 프로젝트 ID
--   @p_user_id: 사용자 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/021_v1_accept_invitation.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_accept_invitation(
    p_invitation_id uuid,
    p_project_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_inv mmcheck.tbl_project_invitations;
BEGIN
    -- 0. 초대 정보 확인
    SELECT * INTO v_inv 
    FROM mmcheck.tbl_project_invitations 
    WHERE id = p_invitation_id;

    -- 1. 초대 상태 업데이트
    UPDATE mmcheck.tbl_project_invitations
    SET 
        status = 'accepted',
        responded_at = now()
    WHERE id = p_invitation_id;

    -- 2. 멤버 등록 (v1_join_project 함수 활용)
    PERFORM mmcheck.v1_join_project(p_project_id, p_user_id, 'member');

    -- 3. 히스토리 기록
    IF FOUND THEN
        INSERT INTO mmcheck.tbl_project_invitation_history (
            project_id, invitation_id, actor_id, invitee_email, action
        )
        VALUES (
            p_project_id, p_invitation_id, p_user_id, v_inv.invitee_email, 'accepted'
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_accept_invitation(uuid, uuid, uuid) IS '프로젝트 초대를 수락하고 사용자를 프로젝트 멤버로 등록합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_accept_invitation(uuid, uuid, uuid) TO authenticated;
