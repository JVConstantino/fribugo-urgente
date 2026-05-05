-- Supabase SQL: Create all tables for Friburgo Urgente
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- articles
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  coverImageId TEXT,
  categoryId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  isBreaking BOOLEAN DEFAULT false,
  isPublished BOOLEAN DEFAULT false,
  publishedAt TIMESTAMPTZ NOT NULL,
  views INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- newsletter
CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT true,
  subscribedAt TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ads
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  imageId TEXT,
  linkUrl TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('leaderboard', 'banner', 'sidebar', 'square')),
  pages TEXT[] NOT NULL DEFAULT '{}',
  startsAt TIMESTAMPTZ NOT NULL,
  endsAt TIMESTAMPTZ NOT NULL,
  isActive BOOLEAN DEFAULT true,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  dailyLimit INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- whatsapp_groups
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  link TEXT NOT NULL,
  category TEXT DEFAULT '',
  imageId TEXT,
  isActive BOOLEAN DEFAULT true,
  sortOrder INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_news
CREATE TABLE IF NOT EXISTS user_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  categoryId TEXT,
  description TEXT,
  location TEXT DEFAULT '',
  whatHappened TEXT DEFAULT '',
  mediaIds TEXT[] DEFAULT '{}',
  authorName TEXT NOT NULL,
  authorPhone TEXT NOT NULL,
  authorEmail TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'rejected')),
  aiSummary TEXT,
  aiCategory TEXT,
  aiAnalysis TEXT,
  adminNotes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ai_config
CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  apiKey TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  systemPrompt TEXT NOT NULL,
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- popups
CREATE TABLE IF NOT EXISTS popups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'group')),
  imageId TEXT,
  linkUrl TEXT,
  groupId TEXT,
  heading TEXT,
  description TEXT,
  startsAt TIMESTAMPTZ NOT NULL,
  endsAt TIMESTAMPTZ NOT NULL,
  isActive BOOLEAN DEFAULT true,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Storage buckets (create via Supabase dashboard)
-- covers
-- user_media

-- Indexes
CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);
CREATE INDEX IF NOT EXISTS articles_categoryId_idx ON articles(categoryId);
CREATE INDEX IF NOT EXISTS articles_isPublished_idx ON articles(isPublished);
CREATE INDEX IF NOT EXISTS articles_publishedAt_idx ON articles(publishedAt DESC);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug);
CREATE INDEX IF NOT EXISTS ads_format_idx ON ads(format);
CREATE INDEX IF NOT EXISTS ads_startsAt_idx ON ads(startsAt);
CREATE INDEX IF NOT EXISTS ads_endsAt_idx ON ads(endsAt);
CREATE INDEX IF NOT EXISTS popups_startsAt_idx ON popups(startsAt);
CREATE INDEX IF NOT EXISTS popups_endsAt_idx ON popups(endsAt);

-- RLS Policies (Row Level Security)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;

-- Public read access for articles (anon users)
CREATE POLICY "Allow public read articles" ON articles FOR SELECT USING (true);

-- Public read access for categories
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);

-- Public read access for newsletter
CREATE POLICY "Allow public read newsletter" ON newsletter FOR SELECT USING (true);
CREATE POLICY "Allow public insert newsletter" ON newsletter FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update newsletter" ON newsletter FOR UPDATE USING (true) WITH CHECK (true);

-- Public read access for ads
CREATE POLICY "Allow public read ads" ON ads FOR SELECT USING (true);

-- Public read access for whatsapp_groups
CREATE POLICY "Allow public read whatsapp_groups" ON whatsapp_groups FOR SELECT USING (true);

-- Public read access for user_news (but auth required for insert)
CREATE POLICY "Allow public read user_news" ON user_news FOR SELECT USING (true);
CREATE POLICY "Allow public insert user_news" ON user_news FOR INSERT WITH CHECK (true);

-- Public read access for ai_config
CREATE POLICY "Allow public read ai_config" ON ai_config FOR SELECT USING (true);

-- Public read access for system_settings
CREATE POLICY "Allow public read system_settings" ON system_settings FOR SELECT USING (true);

-- Public read access for popups
CREATE POLICY "Allow public read popups" ON popups FOR SELECT USING (true);

-- Service role can do everything (authenticated admin operations)
-- This is handled automatically by Supabase with service_role key

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER newsletter_updated_at BEFORE UPDATE ON newsletter FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER whatsapp_groups_updated_at BEFORE UPDATE ON whatsapp_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_news_updated_at BEFORE UPDATE ON user_news FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ai_config_updated_at BEFORE UPDATE ON ai_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER popups_updated_at BEFORE UPDATE ON popups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
