create type public.user_role as enum ('customer', 'provider');
create type public.booking_status as enum ('pending', 'accepted', 'rejected', 'in_progress', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update their own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  category text not null,
  headline text not null,
  bio text not null default '',
  hourly_rate numeric(10,2) not null check (hourly_rate > 0),
  skills text[] not null default '{}',
  area text not null default '',
  response_time text not null default '~2h',
  created_at timestamptz not null default now()
);
grant select on public.provider_profiles to anon;
grant select, insert, update on public.provider_profiles to authenticated;
grant all on public.provider_profiles to service_role;
alter table public.provider_profiles enable row level security;
create policy "Provider profiles are public" on public.provider_profiles for select using (true);
create policy "Providers create their own listing" on public.provider_profiles for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'provider')
);
create policy "Providers update their own listing" on public.provider_profiles for update to authenticated using (auth.uid() = user_id);

create sequence public.booking_number_seq start 1;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default ('QS-' || lpad(nextval('public.booking_number_seq')::text, 6, '0')),
  customer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  provider_profile_id uuid not null references public.provider_profiles(id),
  service_category text not null,
  description text not null check (char_length(description) > 0 and char_length(description) <= 2000),
  booking_date date not null,
  booking_time time not null,
  location text not null check (char_length(location) > 0 and char_length(location) <= 300),
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Participants can view their bookings" on public.bookings for select to authenticated using (auth.uid() = customer_id or auth.uid() = provider_id);
create policy "Customers create bookings" on public.bookings for insert to authenticated with check (
  auth.uid() = customer_id and status = 'pending'
  and exists (select 1 from public.provider_profiles pp where pp.id = provider_profile_id and pp.user_id = provider_id)
);
create policy "Provider updates status" on public.bookings for update to authenticated using (auth.uid() = provider_id) with check (auth.uid() = provider_id);

create or replace function public.enforce_booking_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('rejected', 'completed') then
    raise exception 'Booking % is locked and can no longer be changed', old.booking_number;
  end if;
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending' and new.status in ('accepted', 'rejected'))
      or (old.status = 'accepted' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'completed')
    ) then
      raise exception 'Invalid status change from % to %', old.status, new.status;
    end if;
  end if;
  if new.status = 'accepted' or old.status = 'accepted' or new.status = 'in_progress' then
    if (new.description, new.booking_date, new.booking_time, new.location, new.customer_id, new.provider_id, new.provider_profile_id, new.booking_number)
       is distinct from (old.description, old.booking_date, old.booking_time, old.location, old.customer_id, old.provider_id, old.provider_profile_id, old.booking_number) then
      raise exception 'Booking details are locked once a provider accepts the job';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger booking_transition_guard
  before update on public.bookings
  for each row execute function public.enforce_booking_transition();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Customer reviews own completed booking once" on public.reviews for insert to authenticated with check (
  auth.uid() = customer_id
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'
  )
);

alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.reviews;