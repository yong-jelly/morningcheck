-- =====================================================
-- 026_v1_invite_member.sql
-- 프로젝트에 새로운 멤버를 초대하고 히스토리를 기록하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_inviter_id: 초대자 ID
--   @p_invitee_email: 초대받을 사람의 이메일
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/026_v1_invite_member.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_invite_member(
    p_project_id uuid,
    p_inviter_id uuid,
    p_invitee_email text
)
RETURNS mmcheck.tbl_project_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_invitation mmcheck.tbl_project_invitations;
    v_inviter_email text;
BEGIN
    -- 0. 본인 초대 방지 체크
    SELECT email INTO v_inviter_email FROM auth.users WHERE id = p_inviter_id;
    
    IF v_inviter_email = p_invitee_email THEN
        RAISE EXCEPTION 'You cannot invite yourself';
    END IF;

    -- 1. 대기 중인 초대가 이미 있는지 확인
    SELECT * INTO v_invitation 
    FROM mmcheck.tbl_project_invitations 
    WHERE project_id = p_project_id 
      AND invitee_email = p_invitee_email 
      AND status = 'pending';

    IF FOUND THEN
        RETURN v_invitation;
    END IF;

    -- 2. 초대 생성
    INSERT INTO mmcheck.tbl_project_invitations (
        project_id, inviter_id, invitee_email, status, invited_at
    )
    VALUES (
        p_project_id, p_inviter_id, p_invitee_email, 'pending', now()
    )
    RETURNING * INTO v_invitation;

    -- 3. 히스토리 기록
    INSERT INTO mmcheck.tbl_project_invitation_history (
        project_id, invitation_id, actor_id, invitee_email, action
    )
    VALUES (
        p_project_id, v_invitation.id, p_inviter_id, p_invitee_email, 'invited'
    );

    RETURN v_invitation;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_invite_member IS '프로젝트에 멤버를 초대하고 히스토리를 기록합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_invite_member TO authenticated;
