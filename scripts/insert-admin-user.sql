-- Insert admin user directly into Supabase Auth
-- Run this in Supabase SQL Editor

BEGIN;

-- First, delete any existing user with this email
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);

DELETE FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';

-- Insert the new admin user with correct Supabase schema
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
  '00000000-0000-0000-0000-000000000000',
  'friburgourgente.portal@gmail.com',
  crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true,"name":"Admin Friburgo Urgente","role":"admin"}'::jsonb,
  false,
  now(),
  now()
);

-- Get the ID of the user we just created
-- (We need it for the identity record)
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
)

-- Insert the identity record (required for email login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  new_user.id,
  jsonb_build_object(
    'sub', new_user.id::text,
    'email', 'friburgourgente.portal@gmail.com'
  ),
  'email',
  now(),
  now()
FROM new_user;

COMMIT;

-- Verify the user was created
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'friburgourgente.portal@gmail.com';
