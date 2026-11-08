-- ShoppingBuddy: collaborative shopping routes
-- Run once in Supabase SQL Editor.

create table if not exists public.shopping_routes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  creator_name text not null default 'ShoppingBuddy',
  title text not null check (char_length(title) between 2 and 70),
  city text not null check (char_length(city) between 2 and 100),
  meeting_point text not null check (char_length(meeting_point) between 2 and 150),
  route_date date not null,
  start_time time not null,
  max_participants integer not null default 4 check (max_participants between 2 and 12),
  description text not null default '' check (char_length(description) <= 500),
  stops jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_route_members (
  route_id uuid not null references public.shopping_routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (route_id, user_id)
);

create index if not exists shopping_routes_date_idx on public.shopping_routes(route_date, start_time);
create index if not exists shopping_route_members_user_idx on public.shopping_route_members(user_id);

alter table public.shopping_routes enable row level security;
alter table public.shopping_route_members enable row level security;

drop policy if exists "Authenticated users can view shopping routes" on public.shopping_routes;
create policy "Authenticated users can view shopping routes"
on public.shopping_routes for select to authenticated using (true);

drop policy if exists "Users can create their own shopping routes" on public.shopping_routes;
create policy "Users can create their own shopping routes"
on public.shopping_routes for insert to authenticated
with check (auth.uid() = creator_id);

drop policy if exists "Creators can update their shopping routes" on public.shopping_routes;
create policy "Creators can update their shopping routes"
on public.shopping_routes for update to authenticated
using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists "Creators can delete their shopping routes" on public.shopping_routes;
create policy "Creators can delete their shopping routes"
on public.shopping_routes for delete to authenticated using (auth.uid() = creator_id);

drop policy if exists "Authenticated users can view route memberships" on public.shopping_route_members;
create policy "Authenticated users can view route memberships"
on public.shopping_route_members for select to authenticated using (true);

drop policy if exists "Users can leave their own routes" on public.shopping_route_members;
create policy "Users can leave their own routes"
on public.shopping_route_members for delete to authenticated using (auth.uid() = user_id);

create or replace function public.join_shopping_route(p_route_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Log eerst in om mee te gaan.';
  end if;

  select max_participants into v_limit
  from public.shopping_routes
  where id = p_route_id
  for update;

  if not found then
    raise exception 'Deze shoppingroute bestaat niet meer.';
  end if;

  if exists (
    select 1 from public.shopping_route_members
    where route_id = p_route_id and user_id = v_user_id
  ) then
    return;
  end if;

  select count(*) into v_count
  from public.shopping_route_members
  where route_id = p_route_id;

  if v_count >= v_limit then
    raise exception 'Deze shoppingroute is helaas volzet.';
  end if;

  insert into public.shopping_route_members(route_id, user_id)
  values (p_route_id, v_user_id);
end;
$$;

grant execute on function public.join_shopping_route(uuid) to authenticated;

create or replace view public.shopping_routes_with_counts
with (security_invoker = true)
as
select r.*,
       (select count(*)::integer from public.shopping_route_members m where m.route_id = r.id) as participant_count
from public.shopping_routes r;

grant select on public.shopping_routes_with_counts to authenticated;
