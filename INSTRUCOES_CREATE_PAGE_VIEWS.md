# 📋 Instruções: Criar tabela `page_views` no Supabase

## Passo a Passo

### 1️⃣ Acessar o Supabase SQL Editor

1. Abra: https://friburgourgente-supabase.veuxld.easypanel.host
2. Faça login com suas credenciais admin
3. Clique em **SQL Editor** (menu esquerdo)
4. Clique em **New Query** ou **+ New** (canto superior direito)

### 2️⃣ Copiar o script SQL

Copie TODO o texto abaixo (de `CREATE TABLE...` até o final):

```sql
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
```

### 3️⃣ Colar e executar no Supabase

1. Na janela do SQL Editor, cole o script (Ctrl+V ou Cmd+V)
2. Clique no botão ▶️ **Run** (ou Ctrl+Enter) para executar
3. Aguarde a execução completar

### 4️⃣ Verificar sucesso

Você deve ver mensagens como:
```
CREATE TABLE
CREATE INDEX
ALTER TABLE
CREATE POLICY
CREATE POLICY
```

Se tudo passou, a tabela está criada! ✅

### 5️⃣ Validar dados

No mesmo SQL Editor, execute este query para confirmar:

```sql
SELECT COUNT(*) as total, COUNT(DISTINCT city) as cidades
FROM page_views;
```

Deve retornar `total: 0, cidades: 0` (vazio, pois nenhum acesso foi rastreado ainda).

---

## ✅ Próximas etapas

1. **Gerar dados:**
   - Abra o site em navegador privado (incógnito)
   - Acesse um artigo na home
   - Volte ao SQL Editor e execute o query acima novamente
   - Deve mostrar `total: 1, cidades: 1`

2. **Verificar mapa:**
   - Faça login como admin em `/admin`
   - Vá para `/admin/analises`
   - Deve ver pontos no mapa "Acessos por cidade"
   - Clique em um ponto → popup com nome da cidade e count

---

## ❓ Dúvidas

- **Erro "Table already exists"?** É normal se rodou 2x. Use `IF NOT EXISTS` (já está no script).
- **Erro de permissão?** Verifique se está logado como admin/proprietário da conta Supabase.
- **Mapa ainda vazio após criar tabela?** Visite um artigo primeiro para gerar dados.
