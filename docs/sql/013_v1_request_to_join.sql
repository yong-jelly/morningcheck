-- =====================================================
-- 013_v1_request_to_join.sql
-- 프로젝트 참여 요청을 생성하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_user_id: 사용자 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/013_v1_request_to_join.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_request_to_join(
    p_project_id uuid,
    p_user_id uuid
)
RETURNS mmcheck.tbl_project_join_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_request mmcheck.tbl_project_join_requests;
    v_email text;
BEGIN
    -- 이메일 가져오기
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

    INSERT INTO mmcheck.tbl_project_join_requests (
        project_id, user_id, status
    )
    VALUES (
        p_project_id, p_user_id, 'pending'
    )
    RETURNING * INTO v_request;

    -- 히스토리 기록
    INSERT INTO mmcheck.tbl_project_invitation_history (
        project_id, actor_id, invitee_email, action
    )
    VALUES (
        p_project_id, p_user_id, v_email, 'requested'
    );

    RETURN v_request;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_request_to_join(uuid, uuid) IS '프로젝트 참여 요청을 생성합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_request_to_join(uuid, uuid) TO authenticated;
