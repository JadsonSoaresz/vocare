# Vocare — Configuração do Supabase

## 1. Criar o Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Configure:
   - **Name:** vocare-mvp
   - **Database Password:** (guarde essa senha)
   - **Region:** South America (São Paulo)
4. Aguarde o projeto ser criado (~2 min)

## 2. Executar as Migrations

No Supabase Dashboard, abra o **SQL Editor** e execute:

### Passo 1: Schema
Abra e execute o arquivo `supabase/migrations/001_schema.sql`

### Passo 2: RLS Policies
Abra e execute o arquivo `supabase/migrations/002_rls.sql`

### Passo 3: Seed de Profissões
Abra e execute o arquivo `supabase/seed.sql`

## 3. Configurar Autenticação

No Dashboard → **Authentication → Settings**:

### Email Auth
- ✅ Enable email provider
- ✅ Confirm email (opcional para desenvolvimento, desabilite para testar mais rápido)

### Google OAuth
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto → **APIs & Services → Credentials**
3. **Create OAuth Client ID** → Web application
4. Authorized redirect URIs: `https://SEU_PROJECT_ID.supabase.co/auth/v1/callback`
5. Copie Client ID e Client Secret
6. No Supabase → Authentication → Providers → Google
7. Cole as credenciais

## 4. Configurar Storage

1. Dashboard → **Storage**
2. Criar bucket chamado `public`
3. Tornar o bucket **público** (para avatares)

## 5. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Deploy da função ai-proxy
supabase functions deploy ai-proxy

# Deploy da função generate-career-plan
supabase functions deploy generate-career-plan

# Deploy da função session-summary
supabase functions deploy session-summary
```

## 6. Configurar Secrets das Edge Functions

```bash
# API key da Anthropic
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...

# Verificar
supabase secrets list
```

## 7. Atualizar js/config.js

Copie as credenciais do Dashboard → **Settings → API**:

```javascript
const CONFIG = {
  SUPABASE_URL:      'https://SEU_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'sua-anon-key-aqui',
  // ...
};
```

## 8. Testar

1. Abra `index.html` em um servidor local (ex: Live Server no VS Code)
2. Cadastre um estudante
3. Complete o onboarding
4. Verifique os dados no Dashboard → **Table Editor**

## Dicas de Segurança

- A `SUPABASE_ANON_KEY` é pública e protegida por RLS ✅
- A `SUPABASE_SERVICE_ROLE_KEY` é secreta — use apenas em Edge Functions ⚠️
- A `ANTHROPIC_API_KEY` vai apenas nos secrets do Supabase ⚠️
- Nunca commite `.env` no git — está no `.gitignore` ✅

## Verificar RLS

No SQL Editor, execute para testar:
```sql
-- Verificar que RLS está ativo em todas as tabelas
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

Todas as tabelas devem ter `rowsecurity = true`.
