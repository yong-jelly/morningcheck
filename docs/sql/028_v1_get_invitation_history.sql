-- =====================================================
-- 028_v1_get_invitation_history.sql
-- 프로젝트의 모든 초대/참여 히스토리를 조회하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/028_v1_get_invitation_history.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_get_invitation_history(
    p_project_id uuid
)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    invitation_id uuid,
    actor_id uuid,
    actor_name text,
    actor_avatar text,
    invitee_email text,
    action text,
    metadata jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.project_id,
        h.invitation_id,
        h.actor_id,
        u.display_name as actor_name,
        u.avatar_url as actor_avatar,
        h.invitee_email,
        h.action,
        h.metadata,
        h.created_at
    FROM mmcheck.tbl_project_invitation_history h
    LEFT JOIN mmcheck.tbl_users u ON h.actor_id = u.auth_id
    WHERE h.project_id = p_project_id
    ORDER BY h.created_at DESC;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_get_invitation_history IS '프로젝트의 모든 초대 및 멤버 상태 변경 히스토리를 조회합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_get_invitation_history TO authenticated;
