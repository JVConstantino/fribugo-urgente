-- Script completo de diagnóstico e correção de permissões do GoTrue
-- Execute no SQL Editor do Supabase

-- ============================================================
-- PARTE 1: DIAGNÓSTICO
-- ============================================================

-- 1.1 Permissões das roles no schema auth
SELECT
  grantee,
  table_name,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'auth'
GROUP BY grantee, table_name
ORDER BY grantee, table_name;

-- 1.2 Verificar permissões específicas do supabase_auth_admin
SELECT
  has_schema_privilege('supabase_auth_admin', 'auth', 'USAGE') as schema_usage,
  has_table_privilege('supabase_auth_admin', 'auth.users', 'SELECT') as users_select,
  has_table_privilege('supabase_auth_admin', 'auth.users', 'INSERT') as users_insert,
  has_table_privilege('supabase_auth_admin', 'auth.users', 'UPDATE') as users_update,
  has_table_privilege('supabase_auth_admin', 'auth.sessions', 'SELECT') as sessions_select,
  has_table_privilege('supabase_auth_admin', 'auth.sessions', 'INSERT') as sessions_insert,
  has_table_privilege('supabase_auth_admin', 'auth.refresh_tokens', 'INSERT') as refresh_tokens_insert,
  has_table_privilege('supabase_auth_admin', 'auth.identities', 'SELECT') as identities_select;

-- ============================================================
-- PARTE 2: CORREÇÃO
-- ============================================================

-- 2.1 Permissões completas para supabase_auth_admin
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- 2.2 Permissões para authenticator (role de conexão do GoTrue)
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO authenticator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO authenticator;

-- 2.3 Permissões para anon e authenticated no schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2.4 Garantir que supabase_auth_admin pode fazer SET ROLE
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO authenticator;

-- 2.5 Permissões default para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA auth
  GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth
  GRANT ALL ON SEQUENCES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================================

SELECT
  has_schema_privilege('supabase_auth_admin', 'auth', 'USAGE') as schema_usage,
  has_table_privilege('supabase_auth_admin', 'auth.users', 'SELECT') as users_select,
  has_table_privilege('supabase_auth_admin', 'auth.users', 'INSERT') as users_insert,
  has_table_privilege('supabase_auth_admin', 'auth.sessions', 'INSERT') as sessions_insert,
  has_table_privilege('supabase_auth_admin', 'auth.refresh_tokens', 'INSERT') as refresh_tokens_insert,
  has_table_privilege('supabase_auth_admin', 'auth.identities', 'SELECT') as identities_select,
  has_table_privilege('authenticator', 'auth.users', 'SELECT') as auth_users_select,
  has_table_privilege('anon', 'public.articles', 'SELECT') as anon_articles_select;
