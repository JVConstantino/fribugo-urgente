-- Disable RLS on public tables (data should be readable without authentication)
-- Run this in Supabase SQL Editor

BEGIN;

-- Disable RLS on articles (public data)
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on categories (public data)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS on ads (public data)
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;

-- Disable RLS on popups (public data)
ALTER TABLE popups DISABLE ROW LEVEL SECURITY;

-- Disable RLS on whatsapp_groups (public data)
ALTER TABLE whatsapp_groups DISABLE ROW LEVEL SECURITY;

-- Disable RLS on ai_config (public data)
ALTER TABLE ai_config DISABLE ROW LEVEL SECURITY;

-- Disable RLS on system_settings (public data)
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Keep user_news and newsletter with RLS if they have sensitive data
-- ALTER TABLE user_news DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE newsletter DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
