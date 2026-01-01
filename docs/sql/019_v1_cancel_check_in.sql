-- =====================================================
-- 019_v1_cancel_check_in.sql
-- 체크인 정보를 삭제하는 함수
-- 
-- 인자:
--   @p_check_in_id: 체크인 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/019_v1_cancel_check_in.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_cancel_check_in(
    p_check_in_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    DELETE FROM mmcheck.tbl_project_check_ins
    WHERE id = p_check_in_id;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_cancel_check_in IS '체크인 정보를 삭제합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_cancel_check_in TO authenticated;
