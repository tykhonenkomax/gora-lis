-- Виконати після booking.sql та notifications.sql. Повторне виконання не скидає ціни.
begin;
set local search_path = public, extensions;

create table if not exists public.house_prices (
  house_slug text primary key check (house_slug in ('zrub', 'panorama')),
  base_price integer not null check (base_price between 1 and 1000000),
  extra_guest_price integer not null default 0 check (extra_guest_price between 0 and 1000000)
);
insert into public.house_prices (house_slug, base_price, extra_guest_price)
values ('zrub', 4000, 500), ('panorama', 3000, 0)
on conflict (house_slug) do nothing;

create table if not exists public.seasonal_prices (
  id uuid primary key default gen_random_uuid(),
  house_slug text not null references public.house_prices(house_slug),
  name text not null check (char_length(trim(name)) between 1 and 60),
  starts_on date not null,
  ends_on date not null,
  nightly_price integer not null check (nightly_price between 1 and 1000000),
  check (ends_on >= starts_on and ends_on - starts_on <= 1095),
  -- Обидві дати включені: це перша й остання ніч сезону.
  constraint seasons_do_not_overlap exclude using gist (
    house_slug with =, daterange(starts_on, ends_on, '[]') with &&
  )
);

alter table public.house_prices enable row level security;
alter table public.seasonal_prices enable row level security;
revoke all on public.house_prices, public.seasonal_prices from public, anon, authenticated;
grant select on public.house_prices, public.seasonal_prices to anon, authenticated, service_role;
grant update (base_price, extra_guest_price) on public.house_prices to authenticated;
grant insert, delete on public.seasonal_prices to authenticated;
grant update (name, starts_on, ends_on, nightly_price) on public.seasonal_prices to authenticated;

drop policy if exists "Public house prices" on public.house_prices;
create policy "Public house prices" on public.house_prices for select to anon, authenticated using (true);
drop policy if exists "Owner edits house prices" on public.house_prices;
create policy "Owner edits house prices" on public.house_prices for update to authenticated
  using (exists (select 1 from public.booking_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.booking_admins where user_id = (select auth.uid())));

drop policy if exists "Public seasonal prices" on public.seasonal_prices;
create policy "Public seasonal prices" on public.seasonal_prices for select to anon, authenticated using (true);
drop policy if exists "Owner adds seasons" on public.seasonal_prices;
create policy "Owner adds seasons" on public.seasonal_prices for insert to authenticated
  with check (exists (select 1 from public.booking_admins where user_id = (select auth.uid())));
drop policy if exists "Owner edits seasons" on public.seasonal_prices;
create policy "Owner edits seasons" on public.seasonal_prices for update to authenticated
  using (exists (select 1 from public.booking_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.booking_admins where user_id = (select auth.uid())));
drop policy if exists "Owner removes seasons" on public.seasonal_prices;
create policy "Owner removes seasons" on public.seasonal_prices for delete to authenticated
  using (exists (select 1 from public.booking_admins where user_id = (select auth.uid())));

create or replace function public.get_pricing()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'houses', (select coalesce(jsonb_agg(to_jsonb(h) order by h.house_slug), '[]'::jsonb) from public.house_prices h),
    'seasons', (select coalesce(jsonb_agg(to_jsonb(s) order by s.starts_on), '[]'::jsonb) from public.seasonal_prices s)
  );
$$;
revoke all on function public.get_pricing() from public;
grant execute on function public.get_pricing() to anon, authenticated, service_role;

create or replace function public.quote_booking_price(p_payload jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  base public.house_prices%rowtype;
  first_night date := (p_payload->>'checkIn')::date;
  night_count integer := (p_payload->>'checkOut')::date - first_night;
  guests integer := (p_payload->>'guests')::integer;
  accommodation bigint;
  night_rows jsonb;
  chan integer := case when (p_payload->>'withChan')::boolean then 2000 else 0 end;
begin
  select * into base from public.house_prices where house_slug = p_payload->>'house';
  if not found or night_count is null or night_count not between 2 and 366 or guests is null
    or guests < 1 or guests > (case when base.house_slug = 'zrub' then 6 else 4 end) then
    raise exception 'Invalid quote' using errcode = '22023';
  end if;
  select sum(n.price), jsonb_agg(jsonb_build_object('date', n.day, 'price', n.price) order by n.day)
  into accommodation, night_rows
  from (
    select first_night + d.offset_day as day,
      coalesce(s.nightly_price, base.base_price) + greatest(0, guests - 4) * base.extra_guest_price as price
    from pg_catalog.generate_series(0, night_count - 1) d(offset_day)
    left join public.seasonal_prices s on s.house_slug = base.house_slug
      and first_night + d.offset_day between s.starts_on and s.ends_on
  ) n;
  return jsonb_build_object('nights', night_rows, 'accommodation', accommodation, 'chan', chan, 'total', accommodation + chan);
end;
$$;
revoke all on function public.quote_booking_price(jsonb) from public, anon, authenticated;
grant execute on function public.quote_booking_price(jsonb) to service_role;

alter table public.booking_requests add column if not exists price_quote jsonb;
-- Фіксуємо розрахунок уже отриманих заявок до редагування тарифів власником.
update public.booking_requests set price_quote = public.quote_booking_price(payload) where price_quote is null;

create or replace function public.claim_booking_request(p_id uuid, p_payload jsonb, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.booking_requests%rowtype; quote jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(728461905);
  select * into existing from public.booking_requests where id = p_id for update;
  if found then
    if existing.payload <> p_payload then return jsonb_build_object('error', 'id_conflict'); end if;
    if existing.telegram_sent and existing.email_sent then
      return jsonb_build_object('telegram_sent', true, 'email_sent', true, 'quote', existing.price_quote);
    end if;
    if existing.locked_until > now() then return jsonb_build_object('error', 'processing'); end if;
    update public.booking_requests set locked_until = now() + interval '90 seconds' where id = p_id;
    return jsonb_build_object('telegram_sent', existing.telegram_sent, 'email_sent', existing.email_sent, 'quote', existing.price_quote);
  end if;
  if (select count(*) from public.booking_requests where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 5
    or (select count(*) from public.booking_requests where created_at > now() - interval '1 minute') >= 30 then
    return jsonb_build_object('error', 'rate_limit');
  end if;
  if exists (select 1 from public.reservations where house_slug = p_payload->>'house'
    and check_in < (p_payload->>'checkOut')::date and check_out > (p_payload->>'checkIn')::date)
    then return jsonb_build_object('error', 'occupied'); end if;
  quote := public.quote_booking_price(p_payload);
  insert into public.booking_requests (id, payload, ip_hash, locked_until, price_quote)
    values (p_id, p_payload, p_ip_hash, now() + interval '90 seconds', quote);
  return jsonb_build_object('telegram_sent', false, 'email_sent', false, 'quote', quote);
end;
$$;
revoke all on function public.claim_booking_request(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_booking_request(uuid, jsonb, text) to service_role;
commit;
