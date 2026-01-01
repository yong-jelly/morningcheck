-- =====================================================
-- 011_v1_update_project.sql
-- 프로젝트 정보를 업데이트하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_name: 수정할 프로젝트 이름 (NULL 가능)
--   @p_description: 수정할 프로젝트 설명 (NULL 가능)
--   @p_icon: 수정할 아이콘 (NULL 가능)
--   @p_icon_type: 수정할 아이콘 타입 (NULL 가능)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/011_v1_update_project.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_update_project(
    p_project_id uuid,
    p_name text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_icon text DEFAULT NULL,
    p_icon_type text DEFAULT NULL
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
    SET 
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        icon = COALESCE(p_icon, icon),
        icon_type = COALESCE(p_icon_type, icon_type),
        updated_at = now()
    WHERE id = p_project_id
    RETURNING * INTO v_project;

    RETURN v_project;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_update_project IS '프로젝트 정보를 업데이트합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_update_project TO authenticated;
