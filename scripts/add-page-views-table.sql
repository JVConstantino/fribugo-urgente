-- Tabela para rastrear visualizações com dados geográficos por IP
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'BR',
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_article ON page_views(article_id);
CREATE INDEX IF NOT EXISTS idx_page_views_city ON page_views(city);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read page_views" ON page_views FOR SELECT USING (true);
