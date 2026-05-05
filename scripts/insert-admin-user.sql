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

-- Insert the new admin user
-- Password is hashed using bcrypt: FriburgoUrgente#2026!@#$%
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  recovery_token_expires_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  confirmation_token_sent_at,
  email_change_token_current,
  email_change_token_new,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '3dde6624-81c7-439a-a414-2d77c3a6b352'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'friburgourgente.portal@gmail.com',
  crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf')),
  now(),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"email_verified":true,"name":"Admin Friburgo Urgente","role":"admin"}'::jsonb,
  false,
  now(),
  now(),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  NULL,
  false,
  NULL
);

-- Insert the identity record (required for email login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3dde6624-81c7-439a-a414-2d77c3a6b352'::uuid,
  jsonb_build_object(
    'sub', '3dde6624-81c7-439a-a414-2d77c3a6b352',
    'email', 'friburgourgente.portal@gmail.com'
  ),
  'email',
  now(),
  now(),
  now()
);

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
