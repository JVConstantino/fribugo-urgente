-- Reset admin user authentication
-- Run this in Supabase SQL Editor to fix auth issues

BEGIN;

-- Delete existing user and related auth records
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';

COMMIT;

-- After running above, use Supabase Dashboard -> Authentication -> Users -> "Add user"
-- Or run the Node.js script: node scripts/setup-admin-auth.mjs
