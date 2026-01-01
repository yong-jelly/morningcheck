-- =====================================================
-- 009_fix_foreign_key_to_tbl_users.sql
-- PostgREST의 관계 해석(Relationship lookup)을 위한 외래 키 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/009_fix_foreign_key_to_tbl_users.sql
-- =====================================================

-- 1. tbl_project_members -> tbl_users (auth_id)
-- user_id가 auth.users(id)를 참조하고 있지만, PostgREST 조인을 위해 tbl_users(auth_id)도 참조하도록 추가합니다.
ALTER TABLE mmcheck.tbl_project_members
ADD CONSTRAINT tbl_project_members_user_id_fkey_tbl_users
FOREIGN KEY (user_id) REFERENCES mmcheck.tbl_users(auth_id);

-- 2. tbl_project_check_ins -> tbl_users (auth_id)
ALTER TABLE mmcheck.tbl_project_check_ins
ADD CONSTRAINT tbl_project_check_ins_user_id_fkey_tbl_users
FOREIGN KEY (user_id) REFERENCES mmcheck.tbl_users(auth_id);

-- 3. tbl_project (created_by) -> tbl_users (auth_id)
-- 프로젝트 생성자 정보도 조인할 수 있도록 추가
ALTER TABLE mmcheck.tbl_project
ADD CONSTRAINT tbl_project_created_by_fkey_tbl_users
FOREIGN KEY (created_by) REFERENCES mmcheck.tbl_users(auth_id);

-- 4. PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';

COMMENT ON CONSTRAINT tbl_project_members_user_id_fkey_tbl_users ON mmcheck.tbl_project_members IS 'PostgREST 조인을 위한 tbl_users(auth_id) 참조';
