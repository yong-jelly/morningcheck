-- =====================================================
-- 023_v1_get_user_profile.sql
-- 사용자 프로필 정보를 조회하는 함수
-- 
-- 인자:
--   @p_auth_id: 사용자 Auth ID (UUID)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/023_v1_get_user_profile.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_get_user_profile(
    p_auth_id uuid
)
RETURNS SETOF mmcheck.tbl_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM mmcheck.tbl_users
    WHERE auth_id = p_auth_id
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_get_user_profile IS '사용자의 프로필 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_get_user_profile TO authenticated;
