-- Apaga o usuário admin antigo criado via SQL (que não funciona com GoTrue)
BEGIN;

DELETE FROM auth.sessions WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
DELETE FROM auth.refresh_tokens WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::varchar;
DELETE FROM auth.mfa_factors WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
DELETE FROM auth.identities WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
DELETE FROM public.profiles WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
DELETE FROM auth.users WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;

COMMIT;

SELECT count(*) as restante FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';
