-- Cria admin do zero no auth e no profiles
BEGIN;

-- 1. Apaga registros antigos
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);
DELETE FROM auth.refresh_tokens WHERE user_id IN (
  SELECT id::varchar FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);
DELETE FROM auth.mfa_factors WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com'
);
DELETE FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';

-- 2. Cria o usuário com UUID fixo para facilitar referências
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'friburgourgente.portal@gmail.com',
  crypt('FriburgoUrgente#2026!@#$%', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Admin Friburgo Urgente","role":"admin","email_verified":true}'::jsonb,
  false,
  now(),
  now()
);

-- 3. Cria a identidade para login por email
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","email":"friburgourgente.portal@gmail.com"}'::jsonb,
  'email',
  'friburgourgente.portal@gmail.com',
  now(),
  now(),
  now()
);

-- 4. Cria o perfil público
INSERT INTO public.profiles (id, updated_at)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  now()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verifica
SELECT
  u.id,
  u.email,
  u.role,
  u.aud,
  u.email_confirmed_at,
  u.raw_user_meta_data,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'friburgourgente.portal@gmail.com';
