-- =====================================================
-- 030_v1_archive_project.sql
-- 프로젝트를 아카이브 상태로 변경하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/030_v1_archive_project.sql
-- =====================================================

DROP FUNCTION IF EXISTS mmcheck.v1_archive_project(uuid);

CREATE OR REPLACE FUNCTION mmcheck.v1_archive_project(
    p_project_id uuid
)
RETURNS mmcheck.tbl_project
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_project mmcheck.tbl_project;
BEGIN
    UPDATE mmcheck.tbl_project
    SET archived_at = now()
    WHERE id = p_project_id
    RETURNING * INTO v_project;

    RETURN v_project;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_archive_project IS '프로젝트를 아카이브 처리합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_archive_project TO authenticated;
