-- =====================================================
-- 012_v1_join_project.sql
-- 사용자를 프로젝트 멤버로 등록하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_user_id: 사용자 ID
--   @p_role: 멤버 역할 (owner, member)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/012_v1_join_project.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_join_project(
    p_project_id uuid,
    p_user_id uuid,
    p_role text DEFAULT 'member'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    INSERT INTO mmcheck.tbl_project_members (
        project_id, user_id, role
    )
    VALUES (
        p_project_id, p_user_id, p_role
    )
    ON CONFLICT (project_id, user_id) DO UPDATE
    SET 
        deleted_at = NULL,
        role = EXCLUDED.role,
        joined_at = now();
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_join_project IS '사용자를 프로젝트 멤버로 등록하거나, 이미 탈퇴한 멤버라면 복구합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_join_project TO authenticated;
