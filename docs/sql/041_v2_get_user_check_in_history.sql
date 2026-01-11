-- =====================================================
-- 041_v2_get_user_check_in_history.sql
-- 사용자의 최근 체크인 히스토리를 가져오는 함수 (V2)
-- 
-- 인자:
--   @p_user_id: 사용자 ID
--   @p_limit_days: 조회할 기간 (기본값 6일)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/041_v2_get_user_check_in_history.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v2_get_user_check_in_history(
    p_user_id uuid,
    p_limit_days integer DEFAULT 6
)
RETURNS SETOF mmcheck.tbl_user_check_ins_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM mmcheck.tbl_user_check_ins_v2
    WHERE user_id = p_user_id
      AND check_in_date > (now() AT TIME ZONE 'Asia/Seoul')::date - p_limit_days
    ORDER BY check_in_date DESC;
END;
$$;

COMMENT ON FUNCTION mmcheck.v2_get_user_check_in_history IS '사용자의 최근 N일간의 통합 체크인 히스토리를 조회합니다. (V2)';
GRANT EXECUTE ON FUNCTION mmcheck.v2_get_user_check_in_history TO authenticated;
