-- =============================================================================
-- Миграция: создание Storage bucket для изображений блога
-- Bucket: blog. Запуск: Supabase SQL Editor или через Dashboard -> Storage.
-- =============================================================================

-- Создание bucket для изображений блога (если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog',
  'blog',
  true,
  26214400,  -- 25MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Политики доступа для bucket
-- Публичное чтение для всех файлов в bucket
DROP POLICY IF EXISTS "blog_public_read" ON storage.objects;
CREATE POLICY "blog_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog');

-- Админская загрузка/удаление через service role (выполняется через API routes)
-- Эти политики нужны для дополнительной защиты, но service_role обходит RLS
DROP POLICY IF EXISTS "blog_service_insert" ON storage.objects;
CREATE POLICY "blog_service_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'blog');

DROP POLICY IF EXISTS "blog_service_update" ON storage.objects;
CREATE POLICY "blog_service_update"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'blog');

DROP POLICY IF EXISTS "blog_service_delete" ON storage.objects;
CREATE POLICY "blog_service_delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'blog');
