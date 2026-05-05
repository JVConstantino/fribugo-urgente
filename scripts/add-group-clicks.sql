-- Adiciona métricas de cliques e visualizações nos grupos de WhatsApp
ALTER TABLE whatsapp_groups
  ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
