-- =====================================================
-- 022_v1_get_pending_invitations.sql
-- 대기 중인 초대 목록을 조회하는 함수
-- 
-- 인자:
--   @p_email: 사용자 이메일
--   @p_project_id: 프로젝트 ID (NULL이면 모든 프로젝트 조회)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/022_v1_get_pending_invitations.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_get_pending_invitations(
    p_email text,
    p_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    inviter_id uuid,
    invitee_email text,
    status text,
    invited_at timestamptz,
    responded_at timestamptz,
    project jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        inv.id,
        inv.project_id,
        inv.inviter_id,
        inv.invitee_email,
        inv.status,
        inv.invited_at,
        inv.responded_at,
        to_jsonb(p.*) as project
    FROM mmcheck.tbl_project_invitations inv
    JOIN mmcheck.tbl_project p ON inv.project_id = p.id
    WHERE inv.invitee_email = p_email
      AND inv.status = 'pending'
      AND (p_project_id IS NULL OR inv.project_id = p_project_id);
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_get_pending_invitations IS '사용자의 대기 중인 프로젝트 초대 내역을 조회합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_get_pending_invitations TO authenticated;
