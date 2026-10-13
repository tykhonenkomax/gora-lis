-- Додатково до booking.sql. Можна виконувати повторно.
begin;

-- Старі бронювання залишаються; нові/оновлені повинні мати від 2 ночей.
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.reservations'::regclass and conname = 'minimum_two_nights') then
    alter table public.reservations add constraint minimum_two_nights check (check_out - check_in >= 2) not valid;
  end if;
end $$;

create table if not exists public.booking_requests (
  id uuid primary key,
  payload jsonb not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  telegram_sent boolean not null default false,
  email_sent boolean not null default false,
  locked_until timestamptz not null default now()
);
create index if not exists booking_requests_created on public.booking_requests (created_at);
create index if not exists booking_requests_ip_created on public.booking_requests (ip_hash, created_at);
alter table public.booking_requests enable row level security;
revoke all on public.booking_requests from anon, authenticated;
grant select, insert, update on public.booking_requests to service_role;

create or replace function public.claim_booking_request(p_id uuid, p_payload jsonb, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.booking_requests%rowtype;
begin
  -- Спільний короткий lock не дозволяє обійти ліміт паралельними запитами.
  perform pg_catalog.pg_advisory_xact_lock(728461905);
  select * into existing from public.booking_requests where id = p_id for update;
  if found then
    if existing.payload <> p_payload then return jsonb_build_object('error', 'id_conflict'); end if;
    if existing.telegram_sent and existing.email_sent then
      return jsonb_build_object('telegram_sent', true, 'email_sent', true);
    end if;
    if existing.locked_until > now() then return jsonb_build_object('error', 'processing'); end if;
    update public.booking_requests set locked_until = now() + interval '90 seconds' where id = p_id;
    return jsonb_build_object('telegram_sent', existing.telegram_sent, 'email_sent', existing.email_sent);
  end if;
  if (select count(*) from public.booking_requests where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 5
    or (select count(*) from public.booking_requests where created_at > now() - interval '1 minute') >= 30 then
    return jsonb_build_object('error', 'rate_limit');
  end if;
  if exists (
    select 1 from public.reservations where house_slug = p_payload->>'house'
      and check_in < (p_payload->>'checkOut')::date and check_out > (p_payload->>'checkIn')::date
  ) then return jsonb_build_object('error', 'occupied'); end if;
  insert into public.booking_requests (id, payload, ip_hash, locked_until)
    values (p_id, p_payload, p_ip_hash, now() + interval '90 seconds');
  return jsonb_build_object('telegram_sent', false, 'email_sent', false);
end;
$$;
revoke all on function public.claim_booking_request(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_booking_request(uuid, jsonb, text) to service_role;
commit;
