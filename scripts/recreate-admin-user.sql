-- Apaga o usuário existente e recria do zero
BEGIN;

DELETE FROM auth.sessions WHERE user_id = '72713d6f-f547-4704-831e-ee0a6bceb8fa';
DELETE FROM auth.identities WHERE user_id = '72713d6f-f547-4704-831e-ee0a6bceb8fa';
DELETE FROM public.profiles WHERE id = '72713d6f-f547-4704-831e-ee0a6bceb8fa';
DELETE FROM auth.users WHERE id = '72713d6f-f547-4704-831e-ee0a6bceb8fa';

COMMIT;

-- Verifica que foi apagado
SELECT count(*) as usuarios_restantes FROM auth.users WHERE email = 'friburgourgente.portal@gmail.com';
