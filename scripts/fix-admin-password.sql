-- Fix admin user password in Supabase Auth
-- The issue: crypt() function doesn't match what Supabase Auth expects
-- Solution: Use pgcrypto to generate a proper bcrypt hash

BEGIN;

-- Update the encrypted_password with proper bcrypt hash
UPDATE auth.users
SET encrypted_password = crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf', 12))
WHERE email = 'friburgourgente.portal@gmail.com';

-- Verify the update
SELECT
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'friburgourgente.portal@gmail.com';

COMMIT;
