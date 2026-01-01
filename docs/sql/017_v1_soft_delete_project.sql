-- =====================================================
-- 017_v1_soft_delete_project.sql
-- 프로젝트를 소프트 삭제하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/017_v1_soft_delete_project.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_soft_delete_project(
    p_project_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    UPDATE mmcheck.tbl_project
    SET deleted_at = now()
    WHERE id = p_project_id;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_soft_delete_project IS '프로젝트를 소프트 삭제 처리합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_soft_delete_project TO authenticated;
