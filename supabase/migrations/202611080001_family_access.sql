-- Radar 2.0: estrutura inicial de acesso familiar e preferências privadas.
-- Migração aditiva: não altera nem remove tabelas legadas.
-- Aplicar primeiro em ambiente de teste e revisar o backup antes de produção.

begin;

-- Funções privilegiadas ficam fora do schema exposto pela Data API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.family_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.family_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index if not exists family_members_user_id_idx
  on public.family_members(user_id);

create table if not exists public.user_listing_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('rent', 'purchase', 'vehicle', 'flight')),
  listing_id text not null check (char_length(btrim(listing_id)) between 1 and 500),
  rating smallint check (rating between 1 and 5),
  is_favorite boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, user_id, domain, listing_id)
);

create index if not exists user_listing_preferences_family_domain_idx
  on public.user_listing_preferences(family_id, domain);

create index if not exists user_listing_preferences_user_idx
  on public.user_listing_preferences(user_id);

-- Funções auxiliares SECURITY DEFINER para evitar recursão de RLS ao consultar membros.
create or replace function private.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = (select auth.uid())
  );
$fn$;

create or replace function private.is_family_admin(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = p_family_id
      and fm.user_id = (select auth.uid())
      and fm.role = 'admin'
  );
$fn$;

-- Criação atômica do espaço e do primeiro administrador autenticado.
create or replace function private.create_family_space(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória' using errcode = '42501';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'O nome do espaço familiar deve ter entre 2 e 80 caracteres'
      using errcode = '22023';
  end if;

  insert into public.family_spaces (name, created_by)
  values (v_name, v_user_id)
  returning id into v_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (v_family_id, v_user_id, 'admin');

  return v_family_id;
end;
$fn$;

-- Wrapper exposto para RPC: SECURITY INVOKER (não eleva privilégios).
create or replace function public.create_family_space(p_name text)
returns uuid
language sql
security invoker
set search_path = ''
as $fn$
  select private.create_family_space(p_name);
$fn$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists user_listing_preferences_set_updated_at
  on public.user_listing_preferences;
create trigger user_listing_preferences_set_updated_at
before update on public.user_listing_preferences
for each row execute function private.set_updated_at();

alter table public.family_spaces enable row level security;
alter table public.family_members enable row level security;
alter table public.user_listing_preferences enable row level security;

-- Remover somente policies com os nomes desta migração para permitir reaplicação.
drop policy if exists family_spaces_select_member on public.family_spaces;
create policy family_spaces_select_member
on public.family_spaces for select to authenticated
using (private.is_family_member(id));

drop policy if exists family_spaces_update_admin on public.family_spaces;
create policy family_spaces_update_admin
on public.family_spaces for update to authenticated
using (private.is_family_admin(id))
with check (private.is_family_admin(id));

drop policy if exists family_members_select_same_family on public.family_members;
create policy family_members_select_same_family
on public.family_members for select to authenticated
using (private.is_family_member(family_id));

-- Não há INSERT/UPDATE/DELETE direto em family_members nesta primeira migração.
-- Convites e inclusão de novos membros serão adicionados via fluxo autenticado
-- com token/convite validado no servidor (Edge Function), nunca via cliente anônimo.

drop policy if exists preferences_select_own on public.user_listing_preferences;
create policy preferences_select_own
on public.user_listing_preferences for select to authenticated
using (
  user_id = (select auth.uid())
  and private.is_family_member(family_id)
);

drop policy if exists preferences_insert_own on public.user_listing_preferences;
create policy preferences_insert_own
on public.user_listing_preferences for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_family_member(family_id)
);

drop policy if exists preferences_update_own on public.user_listing_preferences;
create policy preferences_update_own
on public.user_listing_preferences for update to authenticated
using (
  user_id = (select auth.uid())
  and private.is_family_member(family_id)
)
with check (
  user_id = (select auth.uid())
  and private.is_family_member(family_id)
);

drop policy if exists preferences_delete_own on public.user_listing_preferences;
create policy preferences_delete_own
on public.user_listing_preferences for delete to authenticated
using (
  user_id = (select auth.uid())
  and private.is_family_member(family_id)
);

-- Privilégios explícitos: usuários anônimos não acessam estas tabelas.
revoke all on public.family_spaces from public, anon, authenticated;
revoke all on public.family_members from public, anon, authenticated;
revoke all on public.user_listing_preferences from public, anon, authenticated;

grant select on public.family_spaces to authenticated;
grant update (name) on public.family_spaces to authenticated;
grant select on public.family_members to authenticated;
grant select, insert, update, delete on public.user_listing_preferences to authenticated;

revoke all on function private.is_family_member(uuid) from public, anon;
revoke all on function private.is_family_admin(uuid) from public, anon;
revoke all on function private.create_family_space(text) from public, anon;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function public.create_family_space(text) from public, anon;
grant execute on function private.is_family_member(uuid) to authenticated;
grant execute on function private.is_family_admin(uuid) to authenticated;
grant execute on function private.create_family_space(text) to authenticated;
grant execute on function public.create_family_space(text) to authenticated;

commit;
