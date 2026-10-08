-- Виконати один раз у Supabase → SQL Editor.
begin;

create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create table public.booking_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  house_slug text not null check (house_slug in ('zrub', 'panorama')),
  check_in date not null,
  check_out date not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'tentative')),
  created_at timestamptz not null default now(),
  constraint valid_stay check (check_out > check_in and check_out - check_in <= 366),
  -- [заїзд, виїзд): день виїзду можна використати для наступного заїзду.
  -- Захищає також від одночасного збереження з двох телефонів.
  constraint no_overlapping_reservations exclude using gist (
    house_slug with =,
    daterange(check_in, check_out, '[)') with &&
  )
);

alter table public.booking_admins enable row level security;
alter table public.reservations enable row level security;

revoke all on public.booking_admins, public.reservations from anon, authenticated;
grant select on public.booking_admins to authenticated;
grant select, insert, delete on public.reservations to authenticated;
grant update (status) on public.reservations to authenticated;

create policy "Read own admin membership" on public.booking_admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Owner reads reservations" on public.reservations
  for select to authenticated using (
    exists (select 1 from public.booking_admins where user_id = (select auth.uid()))
  );
create policy "Owner adds reservations" on public.reservations
  for insert to authenticated with check (
    check_in >= (now() at time zone 'Europe/Kyiv')::date
    and exists (select 1 from public.booking_admins where user_id = (select auth.uid()))
  );
create policy "Owner cancels reservations" on public.reservations
  for delete to authenticated using (
    exists (select 1 from public.booking_admins where user_id = (select auth.uid()))
  );

create policy "Owner confirms reservations" on public.reservations
  for update to authenticated using (
    exists (select 1 from public.booking_admins where user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.booking_admins where user_id = (select auth.uid()))
  );

-- Відвідувачі отримують лише зайняті ночі одного будинку, без ID бронювань.
create function public.occupied_nights(p_house text, p_from date, p_to date)
returns table (night date, status text)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_house is null or p_house not in ('zrub', 'panorama')
    or p_from is null or p_to is null or p_to <= p_from or p_to - p_from > 62 then
    raise exception 'Invalid calendar range' using errcode = '22023';
  end if;
  return query
    select (p_from + days.offset_day)::date, r.status
    from pg_catalog.generate_series(0, p_to - p_from - 1) as days(offset_day)
    join public.reservations r on r.house_slug = p_house
        and r.check_in <= p_from + days.offset_day
        and r.check_out > p_from + days.offset_day
    order by 1;
end;
$$;

revoke all on function public.occupied_nights(text, date, date) from public;
grant execute on function public.occupied_nights(text, date, date) to anon, authenticated;

commit;
