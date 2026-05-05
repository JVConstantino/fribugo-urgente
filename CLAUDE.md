# Friburgo Urgente — Contexto do Projeto

## Estado atual
Migração Appwrite → Supabase concluída. Site carrega dados normalmente, mas **login admin falha com erro 500: "Database error querying schema"**.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Supabase self-hosted no EasyPanel
- URL: `https://friburgourgente-supabase.veuxld.easypanel.host`
- GoTrue version: v2.184.0
- Schema migration auth: `20251201000000`

## Credenciais de teste
- Email admin: `friburgourgente.portal@gmail.com`
- Senha: `FriburgoUrgente#2026!@#$%`
- User UUID: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`

## JWT_SECRET configurado
`f47ac10b-58cc-4372-a567-0e02b2c3d479-7a8b9c0d-1e2f-3g4h-5i6j-7k8l9m0n1o2p`

## Chaves geradas com esse secret
- ANON_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc3OTU0NDIyLCJleHAiOjE4MDk0OTA0MjJ9.i9A7jVLimVQ40_BggroJUS0o4IIvaa3LXlOiDsoO1HM`
- SERVICE_ROLE_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzc5NTQ0MjIsImV4cCI6MTgwOTQ5MDQyMn0.1p4Z9LklAfgf4kYR1z3Gps0_nzl6SsN5fb8DT_s56RI`

Essas chaves estão configuradas no `.env`, no EasyPanel `ANON_KEY`/`SERVICE_ROLE_KEY` e batem com o `JWT_SECRET`.

## O que foi feito (em ordem cronológica)

### 1. Migração código
- Criado `src/services/supabase.ts` (1100+ linhas) com mesmas assinaturas de `appwrite.ts`
- Atualizado `.env` (de 14 vars Appwrite → 2 vars Supabase)
- Trocados imports em 22 arquivos: `@/services/appwrite` → `@/services/supabase`
- Funções de auth: login usa `signInWithPassword`, isAdmin checa `user_metadata.role === 'admin'`

### 2. Banco de dados
- Tabelas criadas: `articles`, `categories`, `newsletter`, `ads`, `whatsapp_groups`, `user_news`, `ai_config`, `system_settings`, `popups`, `profiles`
- Dados importados (21 documentos)
- Storage buckets: `covers`, `user_media` (públicos)

### 3. RLS
- Inicialmente bloqueava tudo (401)
- Políticas alteradas para `USING (true)` em todas tabelas públicas
- **Funcionando agora**: dados carregam normalmente

### 4. Auth (PROBLEMA ATUAL)
- Usuário admin criado em `auth.users` com:
  - `aud='authenticated'`, `role='authenticated'`
  - `email_confirmed_at` preenchido
  - `raw_user_meta_data: {"name":"...","role":"admin","email_verified":true}`
  - Senha bcrypt: `$2a$12$RDcZfIA0ePuoMP3FiY8feuBz2TfqNCpSNfJu2SM815b7KqcYnm4Li`
- Identidade criada em `auth.identities` com `provider='email'`, `provider_id='friburgourgente.portal@gmail.com'`
- Profile criado em `public.profiles`
- Permissões corrigidas: `supabase_auth_admin` tem ALL em schema auth
- `authenticator` tem permissões em auth e GRANT das outras roles

### 5. Erro persiste
```bash
curl -X POST .../auth/v1/token?grant_type=password -d '{"email":"...","password":"..."}'
# Retorna: {"code":500,"error_code":"unexpected_failure","msg":"Database error querying schema"}
```

- `/auth/v1/health` responde OK (GoTrue está rodando)
- `/auth/v1/signup` falha apenas no email SMTP (mas processa o usuário)
- `auth.audit_log_entries` não registra a tentativa de login (falha antes)
- Testado com ANON_KEY e SERVICE_ROLE_KEY: mesmo erro
- Permissões `supabase_auth_admin`, `authenticator`, `anon` validadas — todas OK

## Tabelas auth existentes (todas OK para v2.184)
audit_log_entries, flow_state, identities, instances, mfa_amr_claims, mfa_challenges, mfa_factors, oauth_authorizations, oauth_client_states, oauth_clients, oauth_consents, one_time_tokens, refresh_tokens, saml_providers, saml_relay_states, schema_migrations, sessions, sso_domains, sso_providers, users

## Trigger ativo
`on_auth_user_created` em `auth.users` → executa `public.handle_new_user()` que faz:
```sql
INSERT INTO public.profiles (id, email, name, role)
VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'role');
```

## Hipóteses ainda a investigar
1. Função/view interna do GoTrue quebrada (`auth.email()`, `auth.role()`, `auth.uid()`, `auth.jwt()`)
2. Permissão de EXECUTE em funções para `supabase_auth_admin`
3. View que o GoTrue consulta no login (sessions/refresh_tokens) com schema incompatível
4. Algum tipo customizado (`USER-DEFINED` em sessions.aal) com permissão errada
5. Trigger `on_auth_user_created` causando rollback no login (improvável, é INSERT)

## Arquivos críticos
- `src/services/supabase.ts` — service layer
- `src/contexts/AuthContext.tsx` — fluxo de login no frontend
- `src/pages/admin/LoginPage.tsx` — UI do login
- `.env` — credenciais
- `scripts/*.sql` — todos os scripts de migração e correção tentados
