-- Create admin user in Supabase Auth
-- Note: This script creates a user in the auth.users table
-- The password will be hashed automatically by Supabase

-- First, ensure the user doesn't exist
DELETE FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';

-- Insert new admin user
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
  email_change_token_new,
  email_change_sent_at,
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
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'friburgourgente.portal@gmail.com',
  crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf')),
  now(),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Friburgo Urgente","role":"admin"}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  NULL,
  false
);

-- Verify the user was created
SELECT email, created_at FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';
