-- =====================================================
-- 034_v2_get_today_check_in.sql
-- 사용자의 오늘의 통합 체크인 정보를 가져오는 함수 (V2)
-- 
-- 인자:
--   @p_user_id: 사용자 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/034_v2_get_today_check_in.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v2_get_today_check_in(
    p_user_id uuid
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
      AND check_in_date = CURRENT_DATE;
END;
$$;

COMMENT ON FUNCTION mmcheck.v2_get_today_check_in IS '사용자의 오늘 날짜 통합 체크인 정보를 조회합니다. (V2)';
GRANT EXECUTE ON FUNCTION mmcheck.v2_get_today_check_in TO authenticated;
