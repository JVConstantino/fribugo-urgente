-- Adiciona campos de WhatsApp e canal na tabela newsletter
ALTER TABLE newsletter
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'both'));
