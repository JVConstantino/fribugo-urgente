-- Adds first-party article video support.
-- Run this in Supabase SQL editor.

BEGIN;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS "videoFileId" TEXT,
  ADD COLUMN IF NOT EXISTS "videoThumbnailImageId" TEXT,
  ADD COLUMN IF NOT EXISTS "videoDurationSeconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "videoEnabled" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "videoCaption" TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS articles_videoEnabled_idx
  ON articles ("videoEnabled")
  WHERE "videoEnabled" = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('article_videos', 'article_videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read/upload/update/delete policies for the article_videos bucket.
-- Mirrors the current broad storage policy style used by covers/user_media.
DROP POLICY IF EXISTS "Public read article_videos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload article_videos" ON storage.objects;
DROP POLICY IF EXISTS "Public update article_videos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete article_videos" ON storage.objects;

CREATE POLICY "Public read article_videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'article_videos');

CREATE POLICY "Public upload article_videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article_videos');

CREATE POLICY "Public update article_videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'article_videos');

CREATE POLICY "Public delete article_videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'article_videos');

COMMIT;
