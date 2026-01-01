-- =====================================================
-- 014_v1_get_join_request.sql
-- 특정 사용자의 프로젝트 참여 요청을 조회하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_user_id: 사용자 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/014_v1_get_join_request.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_get_join_request(
    p_project_id uuid,
    p_user_id uuid
)
RETURNS SETOF mmcheck.tbl_project_join_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM mmcheck.tbl_project_join_requests
    WHERE project_id = p_project_id
      AND user_id = p_user_id
    ORDER BY requested_at DESC
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_get_join_request IS '특정 사용자의 최신 프로젝트 참여 요청을 조회합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_get_join_request TO authenticated;
