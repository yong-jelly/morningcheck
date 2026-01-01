-- =====================================================
-- 003_v1_user_functions.sql
-- 사용자 관련 핵심 함수 및 트리거
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/003_v1_user_functions.sql
-- =====================================================

-- 1. updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION mmcheck.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. tbl_users 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_tbl_users_updated_at ON mmcheck.tbl_users;
CREATE TRIGGER update_tbl_users_updated_at
BEFORE UPDATE ON mmcheck.tbl_users
FOR EACH ROW
EXECUTE PROCEDURE mmcheck.update_updated_at_column();

-- 3. 현재 사용자 ID 가져오기 함수 (bigint)
-- Supabase의 auth.uid() (UUID) 대신 내부 PK인 id (bigint)를 반환합니다.
CREATE OR REPLACE FUNCTION mmcheck.get_current_user_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_user_id bigint;
BEGIN
    -- auth.uid()가 NULL이면 NULL 반환
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id INTO v_user_id
    FROM mmcheck.tbl_users
    WHERE auth_id = auth.uid()
    LIMIT 1;

    RETURN v_user_id;
END;
$$;

-- 4. 권한 부여
GRANT EXECUTE ON FUNCTION mmcheck.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION mmcheck.get_current_user_id() TO authenticated;

-- 5. 코멘트 추가
COMMENT ON FUNCTION mmcheck.update_updated_at_column IS 'updated_at 컬럼을 현재 시간으로 갱신하는 트리거 함수';
COMMENT ON FUNCTION mmcheck.get_current_user_id IS '현재 로그인한 사용자의 고유 ID(bigint)를 반환하는 함수';
