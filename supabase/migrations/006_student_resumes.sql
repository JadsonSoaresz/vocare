-- ============================================================
-- VOCARE — Migration 006: Perfil/currículo do estudante
-- Execute no SQL Editor do Supabase (pode rodar mais de uma vez).
--
-- Cria:
--   • student_resumes  — currículo 1:1 com o estudante
--   • RLS              — dono edita; empresas, mentores e admin só
--                        leem currículos marcados como visíveis
--   • bucket "public"  — políticas para a foto de perfil
-- ============================================================

-- ── 1. Tabela ────────────────────────────────────────────────
create table if not exists public.student_resumes (
  student_id      uuid primary key references public.profiles(id) on delete cascade,

  -- Apresentação
  headline        text check (char_length(headline) <= 120),     -- ex.: "Estudante do 3º ano · Front-end"
  about           text check (char_length(about) <= 1500),       -- resumo / "sobre mim"
  objective       text check (char_length(objective) <= 400),    -- objetivo profissional

  -- Disponibilidade para vagas (mesmos valores de job_listings.job_type)
  looking_for     text[] not null default '{}',
  shift           text check (shift in ('manha','tarde','noite','flexivel')),
  available_from  date,

  -- Listas estruturadas (arrays JSON)
  --   education:      [{ institution, course, level, start, end, current }]
  --   experiences:    [{ title, org, kind, start, end, current, description }]
  --   projects:       [{ name, description, url }]
  --   certifications: [{ name, issuer, year, url }]
  --   languages:      [{ name, level }]
  education       jsonb not null default '[]'::jsonb check (jsonb_typeof(education)      = 'array'),
  experiences     jsonb not null default '[]'::jsonb check (jsonb_typeof(experiences)    = 'array'),
  projects        jsonb not null default '[]'::jsonb check (jsonb_typeof(projects)       = 'array'),
  certifications  jsonb not null default '[]'::jsonb check (jsonb_typeof(certifications) = 'array'),
  languages       jsonb not null default '[]'::jsonb check (jsonb_typeof(languages)      = 'array'),
  skills          text[] not null default '{}',

  -- Links: { linkedin, github, portfolio, instagram }
  links           jsonb not null default '{}'::jsonb check (jsonb_typeof(links) = 'object'),

  -- Personalização visual
  cover_area      text,                                          -- área usada na capa ilustrada
  accent_color    text not null default '#1A3C6E'
                  check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),

  -- Visibilidade: privado por padrão (público-alvo inclui menores de idade)
  is_public       boolean not null default false,
  show_contact    boolean not null default false,               -- exibir e-mail/telefone no currículo

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.student_resumes is
  'Currículo/perfil profissional do estudante. Visível a empresas, mentores e admin apenas quando is_public = true.';

-- Garante que só estudantes tenham currículo
create or replace function public.ensure_resume_owner_is_student()
returns trigger language plpgsql as $$
begin
  if (select role from public.profiles where id = new.student_id) is distinct from 'student' then
    raise exception 'Apenas estudantes podem ter currículo.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_resume_owner_is_student on public.student_resumes;
create trigger trg_resume_owner_is_student
  before insert on public.student_resumes
  for each row execute function public.ensure_resume_owner_is_student();

-- Mantém updated_at atualizado
create or replace function public.touch_student_resume()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_student_resume on public.student_resumes;
create trigger trg_touch_student_resume
  before update on public.student_resumes
  for each row execute function public.touch_student_resume();

create index if not exists idx_resumes_public
  on public.student_resumes (updated_at desc) where is_public;
create index if not exists idx_resumes_looking_for
  on public.student_resumes using gin (looking_for);

-- ── 2. RLS ───────────────────────────────────────────────────
alter table public.student_resumes enable row level security;

drop policy if exists "resumes_select_own"       on public.student_resumes;
drop policy if exists "resumes_select_published" on public.student_resumes;
drop policy if exists "resumes_insert_own"       on public.student_resumes;
drop policy if exists "resumes_update_own"       on public.student_resumes;
drop policy if exists "resumes_delete_own"       on public.student_resumes;

-- O estudante vê o próprio currículo
create policy "resumes_select_own" on public.student_resumes
  for select to authenticated
  using (auth.uid() = student_id);

-- Empresas, mentores e admin veem currículos publicados
-- (outros estudantes não veem)
create policy "resumes_select_published" on public.student_resumes
  for select to authenticated
  using (
    is_public
    and (select role from public.profiles where id = auth.uid()) in ('company','mentor','admin')
  );

create policy "resumes_insert_own" on public.student_resumes
  for insert to authenticated
  with check (auth.uid() = student_id);

create policy "resumes_update_own" on public.student_resumes
  for update to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "resumes_delete_own" on public.student_resumes
  for delete to authenticated
  using (auth.uid() = student_id);

-- ── 3. Foto de perfil (Storage) ─────────────────────────────
-- O app envia para o bucket "public" no caminho avatars/<user_id>.<ext>
insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read_public"  on storage.objects;
drop policy if exists "avatars_insert_own"   on storage.objects;
drop policy if exists "avatars_update_own"   on storage.objects;
drop policy if exists "avatars_delete_own"   on storage.objects;

create policy "avatars_read_public" on storage.objects
  for select
  using (bucket_id = 'public' and name like 'avatars/%');

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public' and name like 'avatars/' || auth.uid()::text || '.%');

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'public' and name like 'avatars/' || auth.uid()::text || '.%');

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'public' and name like 'avatars/' || auth.uid()::text || '.%');
