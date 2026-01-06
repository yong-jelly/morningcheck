-- =====================================================
-- 039_v2_cancel_check_in.sql
-- 통합 체크인 정보를 삭제하는 함수 (V2)
-- 
-- 인자:
--   @p_check_in_id: 체크인 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/039_v2_cancel_check_in.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v2_cancel_check_in(
    p_check_in_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    DELETE FROM mmcheck.tbl_user_check_ins_v2
    WHERE id = p_check_in_id;
END;
$$;

COMMENT ON FUNCTION mmcheck.v2_cancel_check_in IS '통합 체크인 정보를 삭제합니다. (V2)';
GRANT EXECUTE ON FUNCTION mmcheck.v2_cancel_check_in TO authenticated;
