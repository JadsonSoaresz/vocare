-- ============================================================
-- VOCARE — Migration 007: Comunidade (seguir, perfis, feed)
-- Execute no SQL Editor do Supabase DEPOIS da 006.
-- Pode rodar mais de uma vez.
--
-- Regras:
--   • Qualquer usuário pode seguir qualquer usuário.
--   • Perfis são PRIVADOS por padrão: seguir vira um pedido que
--     precisa ser aprovado. O usuário pode tornar o perfil público.
--   • Bloquear desfaz os vínculos e impede novos pedidos.
--   • O feed só tem conquistas geradas pelo próprio banco
--     (triggers) — não há texto livre nem mensagens diretas.
-- ============================================================

-- ── 1. Tabelas ───────────────────────────────────────────────

-- Configurações do perfil social (1:1 com profiles)
create table if not exists public.social_settings (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  is_private  boolean not null default true,
  bio         text check (char_length(bio) <= 160),
  cover_area  text,
  updated_at  timestamptz not null default now()
);

-- Vínculos de seguir
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists idx_follows_following on public.follows (following_id, status);
create index if not exists idx_follows_follower  on public.follows (follower_id, status);

-- Bloqueios
create table if not exists public.blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Feed de conquistas (escrito apenas por triggers)
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('joined','test_completed','plan_created','goals_completed','resume_updated')),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_activities_actor on public.activities (actor_id, created_at desc);

-- "Aplausos" nas conquistas
create table if not exists public.activity_kudos (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id)
);

-- ── 2. Funções auxiliares ────────────────────────────────────

-- Existe bloqueio em qualquer direção entre a e b?
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- O usuário logado pode ver o conteúdo social (feed, listas) de target?
create or replace function public.can_view_social(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    auth.uid() = target
    or (
      not is_blocked(auth.uid(), target)
      and (
        not coalesce((select is_private from social_settings where user_id = target), true)
        or exists (
          select 1 from follows
          where follower_id = auth.uid() and following_id = target and status = 'accepted'
        )
      )
    );
$$;

-- Contagens públicas (aparecem mesmo em perfis privados)
create or replace function public.social_counts(target uuid)
returns table (followers bigint, following bigint, activities bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from follows where following_id = target and status = 'accepted'),
    (select count(*) from follows where follower_id  = target and status = 'accepted'),
    (select count(*) from activities where actor_id = target);
$$;

grant execute on function public.is_blocked(uuid, uuid)   to authenticated;
grant execute on function public.can_view_social(uuid)    to authenticated;
grant execute on function public.social_counts(uuid)      to authenticated;

-- ── 3. Regras de seguir (trigger) ────────────────────────────

create or replace function public.before_follow_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if is_blocked(new.follower_id, new.following_id) then
    raise exception 'Não é possível seguir este perfil.';
  end if;

  -- O status é decidido aqui, nunca pelo cliente
  if coalesce((select is_private from social_settings where user_id = new.following_id), true) then
    new.status := 'pending';
    new.accepted_at := null;
  else
    new.status := 'accepted';
    new.accepted_at := now();
  end if;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists trg_before_follow_insert on public.follows;
create trigger trg_before_follow_insert
  before insert on public.follows
  for each row execute function public.before_follow_insert();

-- Na atualização só é permitido aceitar um pedido
create or replace function public.before_follow_update()
returns trigger language plpgsql as $$
begin
  if new.follower_id <> old.follower_id or new.following_id <> old.following_id then
    raise exception 'Não é permitido alterar o vínculo.';
  end if;
  if old.status = 'pending' and new.status = 'accepted' then
    new.accepted_at := now();
  elsif new.status <> old.status then
    raise exception 'Transição de status inválida.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_before_follow_update on public.follows;
create trigger trg_before_follow_update
  before update on public.follows
  for each row execute function public.before_follow_update();

-- Notificações de pedido / novo seguidor / pedido aceito
create or replace function public.after_follow_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  who text;
begin
  if tg_op = 'INSERT' then
    select name into who from profiles where id = new.follower_id;
    insert into notifications (student_id, type, message)
    values (
      new.following_id,
      case when new.status = 'pending' then 'follow_request' else 'new_follower' end,
      case when new.status = 'pending'
        then coalesce(who, 'Alguém') || ' quer te seguir.'
        else coalesce(who, 'Alguém') || ' começou a te seguir.' end
    );
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    select name into who from profiles where id = new.following_id;
    insert into notifications (student_id, type, message)
    values (new.follower_id, 'follow_accepted', coalesce(who, 'Alguém') || ' aceitou seu pedido para seguir.');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_after_follow_change on public.follows;
create trigger trg_after_follow_change
  after insert or update on public.follows
  for each row execute function public.after_follow_change();

-- Bloquear desfaz os vínculos nos dois sentidos
create or replace function public.after_block_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists trg_after_block_insert on public.blocks;
create trigger trg_after_block_insert
  after insert on public.blocks
  for each row execute function public.after_block_insert();

-- Ao tornar o perfil público, pedidos pendentes são aceitos
create or replace function public.after_social_settings_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_private and not new.is_private then
    update follows set status = 'accepted'
    where following_id = new.user_id and status = 'pending';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_after_social_settings_update on public.social_settings;
create trigger trg_after_social_settings_update
  before update on public.social_settings
  for each row execute function public.after_social_settings_update();

-- ── 4. Conquistas automáticas (triggers) ─────────────────────

-- Entrou na plataforma
create or replace function public.activity_on_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into activities (actor_id, kind) values (new.id, 'joined');
  return new;
end;
$$;

drop trigger if exists trg_activity_profile_insert on public.profiles;
create trigger trg_activity_profile_insert
  after insert on public.profiles
  for each row execute function public.activity_on_profile_insert();

-- Concluiu o teste vocacional
create or replace function public.activity_on_test_completed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.completed_test and not coalesce(old.completed_test, false) then
    insert into activities (actor_id, kind, payload)
    values (new.student_id, 'test_completed',
            jsonb_build_object('top_area', coalesce(new.top_areas[1], null)));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_activity_test_completed on public.vocational_profiles;
create trigger trg_activity_test_completed
  after update on public.vocational_profiles
  for each row execute function public.activity_on_test_completed();

-- Criou (ou trocou) o plano de carreira / concluiu metas
create or replace function public.goals_done(goals jsonb)
returns integer language sql immutable as $$
  select count(*)::int
  from jsonb_array_elements(case when jsonb_typeof(goals) = 'array' then goals else '[]'::jsonb end) g
  where g->>'status' = 'done' or g->>'completed' = 'true' or g->>'done' = 'true';
$$;

create or replace function public.activity_on_career_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p_name   text;
  p_area   text;
  done_new int := goals_done(new.weekly_goals);
  done_old int := case when tg_op = 'UPDATE' then goals_done(old.weekly_goals) else 0 end;
begin
  if tg_op = 'INSERT' or new.profession_id is distinct from old.profession_id then
    select name, area into p_name, p_area from professions where id = new.profession_id;
    insert into activities (actor_id, kind, payload)
    values (new.student_id, 'plan_created',
            jsonb_build_object('profession', p_name, 'area', p_area));
  elsif done_new > done_old then
    insert into activities (actor_id, kind, payload)
    values (new.student_id, 'goals_completed',
            jsonb_build_object('done', done_new,
                               'total', jsonb_array_length(coalesce(new.weekly_goals, '[]'::jsonb))));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_activity_career_plan on public.career_plans;
create trigger trg_activity_career_plan
  after insert or update on public.career_plans
  for each row execute function public.activity_on_career_plan();

-- Atualizou o currículo (no máximo uma vez por dia no feed)
create or replace function public.activity_on_resume()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from activities
    where actor_id = new.student_id and kind = 'resume_updated'
      and created_at > now() - interval '1 day'
  ) then
    insert into activities (actor_id, kind) values (new.student_id, 'resume_updated');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_activity_resume on public.student_resumes;
create trigger trg_activity_resume
  after insert or update on public.student_resumes
  for each row execute function public.activity_on_resume();

-- ── 5. RLS ───────────────────────────────────────────────────
alter table public.social_settings enable row level security;
alter table public.follows         enable row level security;
alter table public.blocks          enable row level security;
alter table public.activities      enable row level security;
alter table public.activity_kudos  enable row level security;

-- social_settings: bio/capa/privacidade são visíveis (exceto para bloqueados)
drop policy if exists "social_select"     on public.social_settings;
drop policy if exists "social_insert_own" on public.social_settings;
drop policy if exists "social_update_own" on public.social_settings;
create policy "social_select" on public.social_settings
  for select to authenticated using (not public.is_blocked(auth.uid(), user_id));
create policy "social_insert_own" on public.social_settings
  for insert to authenticated with check (auth.uid() = user_id);
create policy "social_update_own" on public.social_settings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- follows
drop policy if exists "follows_select"         on public.follows;
drop policy if exists "follows_insert_own"     on public.follows;
drop policy if exists "follows_accept_own"     on public.follows;
drop policy if exists "follows_delete_involved" on public.follows;
create policy "follows_select" on public.follows
  for select to authenticated using (
    follower_id = auth.uid() or following_id = auth.uid()
    or (status = 'accepted' and (public.can_view_social(following_id) or public.can_view_social(follower_id)))
  );
create policy "follows_insert_own" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "follows_accept_own" on public.follows      -- só quem recebe aceita
  for update to authenticated
  using (following_id = auth.uid())
  with check (following_id = auth.uid() and status = 'accepted');
create policy "follows_delete_involved" on public.follows  -- deixar de seguir / remover / recusar
  for delete to authenticated using (follower_id = auth.uid() or following_id = auth.uid());

-- blocks: cada um vê e gerencia só os próprios bloqueios
drop policy if exists "blocks_own" on public.blocks;
create policy "blocks_own" on public.blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- activities: leitura conforme a privacidade; escrita só via triggers
drop policy if exists "activities_select" on public.activities;
create policy "activities_select" on public.activities
  for select to authenticated using (public.can_view_social(actor_id));

-- kudos
drop policy if exists "kudos_select"     on public.activity_kudos;
drop policy if exists "kudos_insert_own" on public.activity_kudos;
drop policy if exists "kudos_delete_own" on public.activity_kudos;
create policy "kudos_select" on public.activity_kudos
  for select to authenticated using (
    exists (select 1 from activities a where a.id = activity_id and public.can_view_social(a.actor_id))
  );
create policy "kudos_insert_own" on public.activity_kudos
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from activities a where a.id = activity_id and public.can_view_social(a.actor_id))
  );
create policy "kudos_delete_own" on public.activity_kudos
  for delete to authenticated using (user_id = auth.uid());

-- ── 6. Dados iniciais ────────────────────────────────────────
-- Usuários existentes começam com perfil privado e uma conquista "entrou"
insert into public.social_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

insert into public.activities (actor_id, kind, created_at)
select p.id, 'joined', p.created_at
from public.profiles p
where not exists (select 1 from public.activities a where a.actor_id = p.id and a.kind = 'joined');
