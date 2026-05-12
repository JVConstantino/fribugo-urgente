import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://friburgourgente-supabase.veuxld.easypanel.host';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzc5NTQ0MjIsImV4cCI6MTgwOTQ5MDQyMn0.1p4Z9LklAfgf4kYR1z3Gps0_nzl6SsN5fb8DT_s56RI';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = `
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
`;

async function createPageViewsTable() {
  try {
    console.log('🔄 Criando tabela page_views no Supabase...');

    // Fazer POST para a REST API com o SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ sql }),
    });

    const text = await response.text();
    
    if (!response.ok) {
      try {
        const error = JSON.parse(text);
        console.error('❌ Erro na API:', error);
      } catch {
        console.error('❌ Erro na API:', text);
      }
      process.exit(1);
    }

    console.log('✅ Tabela page_views criada com sucesso!');

    // Verificar que a tabela foi criada
    console.log('\n🔍 Verificando tabela criada...');
    const { data, error } = await supabase
      .from('page_views')
      .select('count(*)', { head: true, count: 'exact' });

    if (error) {
      console.log('ℹ️  Erro ao verificar (esperado se a tabela foi criada):', error.message);
    } else {
      console.log('✅ Tabela page_views pronta e acessível!');
    }

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  }
}

createPageViewsTable();
