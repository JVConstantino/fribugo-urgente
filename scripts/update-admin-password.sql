-- Atualiza apenas a senha do admin sem apagar o usuário
UPDATE auth.users
SET
  encrypted_password = crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf', 10)),
  updated_at = now()
WHERE email = 'friburgourgente.portal@gmail.com';

-- Verifica
SELECT id, email, email_confirmed_at, updated_at, encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'friburgourgente.portal@gmail.com';
