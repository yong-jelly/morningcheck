-- =====================================================
-- 037_migrate_v1_to_v2_check_ins.sql
-- V1(프로젝트별 체크인) 데이터를 V2(사용자 통합 체크인)로 마이그레이션
-- 
-- 마이그레이션 정책:
--   동일 사용자가 같은 날 여러 프로젝트에 체크인한 경우, 가장 최근(created_at 기준) 기록을 유지합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/037_migrate_v1_to_v2_check_ins.sql
-- =====================================================

DO $$
BEGIN
    -- V1 데이터를 V2 테이블로 복사
    -- DISTINCT ON을 사용하여 사용자별/날짜별로 가장 최신 기록 하나만 선택
    INSERT INTO mmcheck.tbl_user_check_ins_v2 (
        user_id, 
        check_in_date, 
        condition, 
        note, 
        created_at
    )
    SELECT DISTINCT ON (user_id, check_in_date)
        user_id, 
        check_in_date, 
        condition, 
        note, 
        created_at
    FROM mmcheck.tbl_project_check_ins
    ORDER BY user_id, check_in_date, created_at DESC
    ON CONFLICT (user_id, check_in_date) DO NOTHING;

    RAISE NOTICE 'Migration from V1 to V2 check-ins completed.';
END $$;
