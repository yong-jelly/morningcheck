-- =====================================================
-- 016_v1_get_project_by_id.sql
-- 특정 프로젝트의 상세 정보를 관련 정보와 함께 조회하는 함수
-- 
-- 인자:
--   @p_project_id: 프로젝트 ID
--   @p_auth_id: 조회를 요청하는 사용자의 ID
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/016_v1_get_project_by_id.sql
-- =====================================================

-- 기존 함수 삭제 (오버로딩 충돌 방지)
DROP FUNCTION IF EXISTS mmcheck.v1_get_project_by_id(uuid);
DROP FUNCTION IF EXISTS mmcheck.v1_get_project_by_id(uuid, uuid);

CREATE OR REPLACE FUNCTION mmcheck.v1_get_project_by_id(
    p_project_id uuid,
    p_auth_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    icon text,
    icon_type text,
    invite_code text,
    visibility_type text,
    created_by uuid,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    archived_at timestamptz,
    members jsonb,
    check_ins jsonb,
    stats jsonb,
    join_requests jsonb,
    invitations jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.icon,
        p.icon_type,
        p.invite_code,
        p.visibility_type,
        p.created_by,
        p.created_at,
        p.updated_at,
        p.deleted_at,
        p.archived_at,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'user_id', m.user_id,
                'role', m.role,
                'user', jsonb_build_object(
                    'display_name', u.display_name,
                    'avatar_url', u.avatar_url
                )
            ))
            FROM mmcheck.tbl_project_members m
            JOIN mmcheck.tbl_users u ON m.user_id = u.auth_id
            WHERE m.project_id = p.id AND m.deleted_at IS NULL
        ) as members,
        (
            SELECT jsonb_agg(ci.*)
            FROM mmcheck.tbl_project_check_ins ci
            WHERE ci.project_id = p.id
        ) as check_ins,
        (
            SELECT jsonb_agg(s.*)
            FROM mmcheck.tbl_project_daily_stats s
            WHERE s.project_id = p.id
        ) as stats,
        (
            SELECT jsonb_agg(jr.*)
            FROM mmcheck.tbl_project_join_requests jr
            WHERE jr.project_id = p.id
        ) as join_requests,
        (
            SELECT jsonb_agg(inv.*)
            FROM mmcheck.tbl_project_invitations inv
            WHERE inv.project_id = p.id
        ) as invitations
    FROM mmcheck.tbl_project p
    WHERE p.id = p_project_id
      AND p.deleted_at IS NULL
      AND (
          p.archived_at IS NULL 
          OR (p_auth_id IS NOT NULL AND p.created_by = p_auth_id)
      );
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_get_project_by_id(uuid, uuid) IS '특정 프로젝트의 모든 상세 정보를 조회합니다. 아카이브된 프로젝트는 생성자만 조회 가능합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_get_project_by_id(uuid, uuid) TO authenticated;
