-- =====================================================
-- 004_create_storage_bucket.sql
-- MorningCheck 프로필 이미지 저장을 위한 Storage 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/004_create_storage_bucket.sql
-- =====================================================

-- 1. 버킷 생성 (mmcheck-user-images)
-- public: true (누구나 조회 가능)
-- file_size_limit: 5MB (5242880 bytes)
-- allowed_mime_types: jpeg, png, webp, gif
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mmcheck-user-images', 
    'mmcheck-user-images', 
    true, 
    5242880, 
    '{image/jpeg,image/png,image/webp,image/gif}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS 정책 설정 (storage.objects 테이블에 직접 적용)

-- [SELECT] 누구나 프로필 이미지를 조회할 수 있음
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;
CREATE POLICY "Public can read profile images" ON storage.objects
    FOR SELECT TO public 
    USING (bucket_id = 'mmcheck-user-images');

-- [INSERT] 인증된 사용자는 자신의 폴더에만 업로드할 수 있음
-- 폴더 구조: {auth_id}/...
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'mmcheck-user-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [SELECT] 인증된 사용자는 자신의 폴더 내용을 조회할 수 있음 (관리용)
DROP POLICY IF EXISTS "Users can read own folder" ON storage.objects;
CREATE POLICY "Users can read own folder" ON storage.objects
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'mmcheck-user-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [DELETE] 인증된 사용자는 자신의 이미지를 삭제할 수 있음
DROP POLICY IF EXISTS "Users can delete own folder" ON storage.objects;
CREATE POLICY "Users can delete own folder" ON storage.objects
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'mmcheck-user-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [UPDATE] 인증된 사용자는 자신의 이미지를 업데이트할 수 있음
DROP POLICY IF EXISTS "Users can update own folder" ON storage.objects;
CREATE POLICY "Users can update own folder" ON storage.objects
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'mmcheck-user-images' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [INSERT] 인증된 사용자에 대한 일반적인 권한 허용 (필요시)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
CREATE POLICY "Enable insert for authenticated users only" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'mmcheck-user-images');

-- 3. 버킷 생성 (mmcheck-project-icons)
-- public: true (누구나 조회 가능)
-- file_size_limit: 5MB (5242880 bytes)
-- allowed_mime_types: jpeg, png, webp, gif, svg
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mmcheck-project-icons', 
    'mmcheck-project-icons', 
    true, 
    5242880, 
    '{image/jpeg,image/png,image/webp,image/gif,image/svg+xml}'
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS 정책 설정 (mmcheck-project-icons)

-- [SELECT] 누구나 아이콘 조회 가능
DROP POLICY IF EXISTS "Public can read project icons" ON storage.objects;
CREATE POLICY "Public can read project icons" ON storage.objects
    FOR SELECT TO public 
    USING (bucket_id = 'mmcheck-project-icons');

-- [INSERT] 인증된 사용자는 자신의 폴더에 업로드 가능
DROP POLICY IF EXISTS "Users can upload project icons" ON storage.objects;
CREATE POLICY "Users can upload project icons" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'mmcheck-project-icons' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- [DELETE] 생성자만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own project icons" ON storage.objects;
CREATE POLICY "Users can delete own project icons" ON storage.objects
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'mmcheck-project-icons' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
