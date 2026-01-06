-- =====================================================
-- 036_v2_get_project_check_ins.sql
-- 특정 프로젝트 멤버들의 전체 체크인 히스토리를 조회하는 함수 (V2)
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_limit_days: 조회할 기간 (일 수, 기본값 30)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/036_v2_get_project_check_ins.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v2_get_project_check_ins(
    p_project_id uuid,
    p_limit_days integer DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    display_name text,
    avatar_url text,
    condition integer,
    note text,
    check_in_date date,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uci.id,
        uci.user_id,
        COALESCE(u.display_name, '익명') as display_name,
        u.avatar_url,
        uci.condition,
        uci.note,
        uci.check_in_date,
        uci.created_at
    FROM mmcheck.tbl_project_members m
    JOIN mmcheck.tbl_user_check_ins_v2 uci ON m.user_id = uci.user_id
    LEFT JOIN mmcheck.tbl_users u ON uci.user_id = u.auth_id
    WHERE m.project_id = p_project_id
      AND m.deleted_at IS NULL
      AND uci.check_in_date > (CURRENT_DATE - p_limit_days)
    ORDER BY uci.check_in_date DESC, uci.created_at DESC;
END;
$$;

COMMENT ON FUNCTION mmcheck.v2_get_project_check_ins IS '프로젝트 멤버들의 최근 체크인 히스토리를 조회합니다. (V2)';
GRANT EXECUTE ON FUNCTION mmcheck.v2_get_project_check_ins TO authenticated;
