-- =====================================================
-- 024_v1_upsert_user_profile.sql
-- 사용자 프로필 정보를 생성하거나 업데이트하는 함수
-- 
-- 인자:
--   @p_auth_id: 사용자 Auth ID (UUID)
--   @p_email: 이메일
--   @p_display_name: 표시 이름
--   @p_avatar_url: 프로필 이미지 URL (NULL 가능)
--   @p_bio: 자기소개 (NULL 가능)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/024_v1_upsert_user_profile.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_upsert_user_profile(
    p_auth_id uuid,
    p_email text,
    p_display_name text,
    p_avatar_url text DEFAULT NULL,
    p_bio text DEFAULT NULL
)
RETURNS mmcheck.tbl_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_user mmcheck.tbl_users;
BEGIN
    INSERT INTO mmcheck.tbl_users (
        auth_id, email, display_name, avatar_url, bio, updated_at
    )
    VALUES (
        p_auth_id, p_email, p_display_name, p_avatar_url, p_bio, now()
    )
    ON CONFLICT (auth_id) DO UPDATE
    SET 
        display_name = EXCLUDED.display_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, mmcheck.tbl_users.avatar_url),
        bio = COALESCE(EXCLUDED.bio, mmcheck.tbl_users.bio),
        updated_at = now()
    RETURNING * INTO v_user;

    RETURN v_user;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_upsert_user_profile IS '사용자 프로필 정보를 생성하거나 업데이트합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_upsert_user_profile TO authenticated;
