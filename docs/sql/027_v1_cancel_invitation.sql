-- =====================================================
-- 027_v1_cancel_invitation.sql
-- 프로젝트 초대를 취소하고 히스토리를 기록하는 함수
-- 
-- 인자:
--   @p_invitation_id: 초대 ID
--   @p_actor_id: 취소자 ID (보통 프로젝트 관리자)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/027_v1_cancel_invitation.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_cancel_invitation(
    p_invitation_id uuid,
    p_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_inv mmcheck.tbl_project_invitations;
BEGIN
    -- 1. 초대 정보 확인
    SELECT * INTO v_inv 
    FROM mmcheck.tbl_project_invitations 
    WHERE id = p_invitation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;

    -- 2. 상태 업데이트
    UPDATE mmcheck.tbl_project_invitations
    SET 
        status = 'cancelled',
        responded_at = now()
    WHERE id = p_invitation_id;

    -- 3. 히스토리 기록
    INSERT INTO mmcheck.tbl_project_invitation_history (
        project_id, invitation_id, actor_id, invitee_email, action
    )
    VALUES (
        v_inv.project_id, v_inv.id, p_actor_id, v_inv.invitee_email, 'cancelled'
    );
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_cancel_invitation IS '프로젝트 초대를 취소하고 히스토리를 기록합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_cancel_invitation TO authenticated;
