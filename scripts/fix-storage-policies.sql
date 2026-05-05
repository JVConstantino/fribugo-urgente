-- Permite upload, leitura, atualização e remoção em buckets covers e user_media
BEGIN;

-- Apaga políticas antigas se existirem
DROP POLICY IF EXISTS "Public read covers" ON storage.objects;
DROP POLICY IF EXISTS "Public upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Public update covers" ON storage.objects;
DROP POLICY IF EXISTS "Public delete covers" ON storage.objects;
DROP POLICY IF EXISTS "Public read user_media" ON storage.objects;
DROP POLICY IF EXISTS "Public upload user_media" ON storage.objects;
DROP POLICY IF EXISTS "Public update user_media" ON storage.objects;
DROP POLICY IF EXISTS "Public delete user_media" ON storage.objects;

-- Bucket covers: leitura pública, upload/update/delete autenticado
CREATE POLICY "Public read covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Public upload covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Public update covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'covers');

CREATE POLICY "Public delete covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'covers');

-- Bucket user_media: idem
CREATE POLICY "Public read user_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'user_media');

CREATE POLICY "Public upload user_media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user_media');

CREATE POLICY "Public update user_media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user_media');

CREATE POLICY "Public delete user_media" ON storage.objects
  FOR DELETE USING (bucket_id = 'user_media');

COMMIT;

-- Verifica
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
