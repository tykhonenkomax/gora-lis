-- Перевірка чинної схеми. Усі зміни залишаються всередині транзакції та відкочуються.
begin;
select set_config('request.jwt.claim.sub', (select user_id::text from public.booking_admins limit 1), true);
set local role authenticated;

do $$
declare changed integer;
begin
  update public.house_prices set base_price = 4500, extra_guest_price = 650 where house_slug = 'zrub';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Owner cannot update prices'; end if;
  insert into public.seasonal_prices (house_slug, name, starts_on, ends_on, nightly_price)
    values ('zrub', 'TEST — rollback', '2190-05-11', '2190-05-12', 6500);
  begin
    insert into public.seasonal_prices (house_slug, name, starts_on, ends_on, nightly_price)
      values ('zrub', 'TEST overlap — rollback', '2190-05-12', '2190-05-13', 7000);
    raise exception 'Overlap was incorrectly accepted';
  exception when exclusion_violation then null;
  end;
end;
$$;

reset role;
do $$
declare
  request_id uuid := gen_random_uuid();
  payload jsonb := '{"house":"zrub","checkIn":"2190-05-10","checkOut":"2190-05-13","guests":5,"withChan":true,"name":"TEST rollback","phone":"0967773015"}';
  quote jsonb;
  claimed jsonb;
begin
  quote := public.quote_booking_price(payload);
  if (quote->>'total')::integer <> 21450 then raise exception 'Wrong mixed-season total: %', quote; end if;
  if (quote->'nights'->0->>'price')::integer <> 5150 or (quote->'nights'->2->>'price')::integer <> 7150 then
    raise exception 'Wrong season boundary calculation';
  end if;
  claimed := public.claim_booking_request(request_id, payload, 'test-price-rollback');
  if claimed ? 'error' or claimed->'quote' <> quote then raise exception 'Quote not saved: %', claimed; end if;
  update public.booking_requests set telegram_sent = true, email_sent = true where id = request_id;
  update public.house_prices set base_price = 9999 where house_slug = 'zrub';
  update public.seasonal_prices set nightly_price = 9999 where name = 'TEST — rollback';
  claimed := public.claim_booking_request(request_id, payload, 'test-price-rollback');
  if claimed->'quote' <> quote then raise exception 'Existing request quote changed after price edit'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000000', true);
set local role authenticated;
do $$
declare changed integer;
begin
  update public.house_prices set base_price = 1 where house_slug = 'zrub';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Non-owner can edit prices'; end if;
  begin
    insert into public.seasonal_prices (house_slug, name, starts_on, ends_on, nightly_price)
      values ('panorama', 'TEST forbidden', '2190-05-11', '2190-05-12', 1);
    raise exception 'Non-owner can create seasons';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  if jsonb_array_length(public.get_pricing()->'houses') <> 2 then raise exception 'Public pricing unavailable'; end if;
  begin
    update public.house_prices set base_price = 1 where house_slug = 'zrub';
    raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'Pricing, owner permissions, anonymous restrictions, overlap protection and quote snapshots verified; all test changes rolled back.' as result;
