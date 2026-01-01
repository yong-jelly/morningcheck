-- =====================================================
-- 020_v1_leave_project.sql
-- 프로젝트에서 탈퇴(소프트 삭제) 처리하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_user_id: 사용자 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/020_v1_leave_project.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_leave_project(
    p_project_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    UPDATE mmcheck.tbl_project_members
    SET deleted_at = now()
    WHERE project_id = p_project_id
      AND user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_leave_project IS '사용자를 프로젝트 멤버에서 탈퇴(소프트 삭제) 처리합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_leave_project TO authenticated;
