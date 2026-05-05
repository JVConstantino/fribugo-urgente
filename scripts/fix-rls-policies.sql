-- Fix RLS policies to allow public read without authentication
-- Run this in Supabase SQL Editor

BEGIN;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public read articles" ON articles;
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
DROP POLICY IF EXISTS "Allow public read ads" ON ads;
DROP POLICY IF EXISTS "Allow public read popups" ON popups;
DROP POLICY IF EXISTS "Allow public read whatsapp_groups" ON whatsapp_groups;
DROP POLICY IF EXISTS "Allow public read ai_config" ON ai_config;
DROP POLICY IF EXISTS "Allow public read system_settings" ON system_settings;
DROP POLICY IF EXISTS "Allow public read user_news" ON user_news;

-- Create new permissive policies that allow public read (authenticated OR anon)
CREATE POLICY "Public read articles" ON articles
    FOR SELECT
    USING (true);

CREATE POLICY "Public read categories" ON categories
    FOR SELECT
    USING (true);

CREATE POLICY "Public read ads" ON ads
    FOR SELECT
    USING (true);

CREATE POLICY "Public read popups" ON popups
    FOR SELECT
    USING (true);

CREATE POLICY "Public read whatsapp_groups" ON whatsapp_groups
    FOR SELECT
    USING (true);

CREATE POLICY "Public read ai_config" ON ai_config
    FOR SELECT
    USING (true);

CREATE POLICY "Public read system_settings" ON system_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Public read user_news" ON user_news
    FOR SELECT
    USING (true);

-- Newsletter - allow public insert/update/read
DROP POLICY IF EXISTS "Allow public read newsletter" ON newsletter;
DROP POLICY IF EXISTS "Allow public insert newsletter" ON newsletter;
DROP POLICY IF EXISTS "Allow public update newsletter" ON newsletter;

CREATE POLICY "Public insert newsletter" ON newsletter
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public read newsletter" ON newsletter
    FOR SELECT
    USING (true);

COMMIT;

-- Verify
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
