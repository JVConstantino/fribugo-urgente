-- Reset admin user with correct password setup
-- Run this in Supabase SQL Editor

BEGIN;

-- Delete existing user and related records
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';

-- Insert new admin user with password using pgcrypto
-- The password hash must match what Supabase Auth expects
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'friburgourgente.portal@gmail.com',
  crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf', 12)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true,"name":"Admin Friburgo Urgente","role":"admin"}'::jsonb,
  false,
  now(),
  now()
);

-- Insert the identity record
WITH user_insert AS (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  user_insert.id,
  jsonb_build_object(
    'sub', user_insert.id::text,
    'email', 'friburgourgente.portal@gmail.com'
  ),
  'email',
  '00000000-0000-0000-0000-000000000001'::uuid,
  now(),
  now()
FROM user_insert;

COMMIT;

-- Verify
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'friburgourgente.portal@gmail.com';
