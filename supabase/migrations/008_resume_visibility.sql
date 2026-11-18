-- ============================================================
-- VOCARE — Migration 008: níveis de visibilidade do currículo
-- Execute no SQL Editor do Supabase DEPOIS da 006 e da 007.
-- Pode rodar mais de uma vez.
--
--   private    → só o próprio estudante
--   companies  → + empresas, mentores e equipe Vocare
--   followers  → + seguidores aprovados na comunidade
--   everyone   → qualquer usuário logado
--
-- Bloqueios (007) sempre têm prioridade: quem foi bloqueado
-- não vê o currículo, seja qual for o nível.
-- ============================================================

-- ── 1. Coluna ────────────────────────────────────────────────
alter table public.student_resumes
  add column if not exists visibility text not null default 'private';

alter table public.student_resumes
  drop constraint if exists student_resumes_visibility_check;
alter table public.student_resumes
  add constraint student_resumes_visibility_check
  check (visibility in ('private','companies','followers','everyone'));

-- Quem já tinha ligado "visível para empresas" continua igual
update public.student_resumes
set visibility = 'companies'
where is_public and visibility = 'private';

-- is_public continua existindo (painel da empresa usa) e passa a
-- ser derivado da visibilidade
create or replace function public.sync_resume_is_public()
returns trigger language plpgsql as $$
begin
  new.is_public := new.visibility <> 'private';
  return new;
end;
$$;

drop trigger if exists trg_sync_resume_is_public on public.student_resumes;
create trigger trg_sync_resume_is_public
  before insert or update on public.student_resumes
  for each row execute function public.sync_resume_is_public();

-- ── 2. Regra de leitura ─────────────────────────────────────
drop policy if exists "resumes_select_published" on public.student_resumes;
drop policy if exists "resumes_select_visible"   on public.student_resumes;

create policy "resumes_select_visible" on public.student_resumes
  for select to authenticated
  using (
    not public.is_blocked(auth.uid(), student_id)
    and (
      visibility = 'everyone'
      or (
        visibility in ('companies','followers')
        and (select role from public.profiles where id = auth.uid()) in ('company','mentor','admin')
      )
      or (
        visibility = 'followers'
        and exists (
          select 1 from public.follows
          where follower_id = auth.uid() and following_id = student_id and status = 'accepted'
        )
      )
    )
  );
