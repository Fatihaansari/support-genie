create extension if not exists pgcrypto;

do $$
declare
  pwd text := crypt('quickserve123', gen_salt('bf'));
  rec record;
  cid uuid;  -- demo customer id
  pp record;
  bid uuid;
begin
  -- Create auth users + identities + profiles + provider listings
  for rec in (
    select * from (values
      ('marcus@quickserve.demo','Marcus Bell','provider','/images/provider-marcus.jpg','Electrician','Panel work, EV chargers & repairs','Licensed electrician with 14 years on residential and small commercial jobs. Clean work, clear pricing, same-week availability.',78,'{Panel work,EV chargers,Rewiring,Lighting}','Riverside','~1h'),
      ('priya@quickserve.demo','Priya Nair','provider','/images/provider-priya.jpg','Plumber','Leaks, drains & full re-pipes','Neat, on-time, and honest about scope. From a dripping tap to a full bath re-pipe — the work area is left cleaner than it was found.',65,'{Leak repair,Drains,Fixtures,Water heaters}','Riverside','~2h'),
      ('tom@quickserve.demo','Tom Okafor','provider','/images/provider-tom.jpg','Tutor','Algebra, SAT prep & physics','Patient, structured tutoring that builds real confidence. Every session ends with a short recap parents can read.',52,'{Algebra,SAT prep,Physics,Study skills}','Oak District','~3h'),
      ('sofia@quickserve.demo','Sofia Reyes','provider','/images/provider-sofia.jpg','Dog Walker','Daily walks & weekend adventures','Reliable 30- and 60-minute walks with photo updates. Comfortable with big dogs, shy dogs, and everything in between.',28,'{Daily walks,Puppies,Senior dogs,Pet sitting}','Cedar Park','~1h'),
      ('jonas@quickserve.demo','Jonas Weber','provider','/images/provider-jonas.jpg','Cleaner','Deep cleans & weekly upkeep','Eco-friendly products, checklists for every room, and a re-clean guarantee if anything is missed.',45,'{Deep clean,Move-out,Weekly upkeep,Eco products}','Harbor Side','~4h'),
      ('marta@quickserve.demo','Marta Kowal','provider','/images/provider-marta.jpg','Gardener','Gardens, lawns & pruning','Thirty years of turning tired yards into gardens people actually use. Seasonal plans available.',58,'{Pruning,Lawn care,Planting,Seasonal plans}','Riverside','~1d'),
      ('customer@quickserve.demo','Alex Morgan','customer',null,null,null,null,null,null,null,null)
    ) as t(email, full_name, role, avatar_url, category, headline, bio, hourly_rate, skills, area, response_time)
  ) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      rec.email, pwd, now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.full_name, 'role', rec.role),
      false, '', '', '', ''
    )
    on conflict do nothing
    returning id into cid;

    if cid is null then
      select id into cid from auth.users where email = rec.email;
    end if;

    insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), cid::text, cid, jsonb_build_object('sub', cid::text, 'email', rec.email), 'email', now(), now(), now())
    on conflict do nothing;

    if rec.role = 'provider' then
      insert into public.provider_profiles (user_id, category, headline, bio, hourly_rate, skills, area, response_time)
      values (cid, rec.category, rec.headline, rec.bio, rec.hourly_rate::numeric, rec.skills::text[], rec.area, rec.response_time)
      on conflict (user_id) do nothing;
    end if;
  end loop;

  -- Demo bookings + reviews from the demo customer
  select id into cid from auth.users where email = 'customer@quickserve.demo';

  for pp in
    select p.user_id, p.id as profile_id, p.category, p.hourly_rate
    from public.provider_profiles p
    join auth.users u on u.id = p.user_id
    order by u.email
  loop
    -- completed booking + review for each provider
    insert into public.bookings (customer_id, provider_id, provider_profile_id, service_category, description, booking_date, booking_time, location, status, created_at, updated_at)
    values (cid, pp.user_id, pp.profile_id, pp.category,
      case pp.category
        when 'Electrician' then 'Install a dedicated EV charger circuit in the garage.'
        when 'Plumber' then 'Kitchen tap has been leaking for a week, needs a proper fix.'
        when 'Tutor' then 'Weekly algebra sessions for my son, Tuesdays after school.'
        when 'Dog Walker' then 'Daily 30-minute walks for Biscuit while I am at work.'
        when 'Cleaner' then 'Deep clean of a two-bedroom flat before move-in.'
        else 'Prune the roses and sort the overgrown side bed.'
      end,
      current_date - 12, '09:00', '148 Alder St, Riverside', 'completed',
      now() - interval '20 days', now() - interval '12 days')
    returning id into bid;

    insert into public.reviews (booking_id, customer_id, provider_id, rating, comment)
    values (bid, cid, pp.user_id,
      case pp.category when 'Tutor' then 5 when 'Dog Walker' then 5 when 'Cleaner' then 4 else 5 end,
      case pp.category
        when 'Electrician' then 'Marcus was on time, tidy, and explained every wire. Charger works perfectly.'
        when 'Plumber' then 'Priya fixed the tap in under an hour and left the kitchen spotless.'
        when 'Tutor' then 'Tom is patient and structured. Grades went from C to A- in a term.'
        when 'Dog Walker' then 'Sofia sends a photo every walk. Biscuit adores her.'
        when 'Cleaner' then 'Very thorough deep clean. One shelf was missed but Jonas came back same day.'
        else 'Marta transformed the side bed. The garden finally feels alive.'
      end);
  end loop;

  -- one accepted + one in-progress live booking
  select p.user_id, p.id as profile_id, p.category into pp from public.provider_profiles p join auth.users u on u.id = p.user_id where u.email = 'priya@quickserve.demo';
  insert into public.bookings (customer_id, provider_id, provider_profile_id, service_category, description, booking_date, booking_time, location, status)
  values (cid, pp.user_id, pp.profile_id, pp.category, 'Replace the old water heater with a 50L unit.', current_date + 3, '13:00', '7 Pine Ct, Riverside', 'accepted');

  select p.user_id, p.id as profile_id, p.category into pp from public.provider_profiles p join auth.users u on u.id = p.user_id where u.email = 'sofia@quickserve.demo';
  insert into public.bookings (customer_id, provider_id, provider_profile_id, service_category, description, booking_date, booking_time, location, status)
  values (cid, pp.user_id, pp.profile_id, pp.category, 'Week of morning walks for Biscuit, Mon to Fri.', current_date, '08:30', '22 Birch Ln, Cedar Park', 'in_progress');
end $$;