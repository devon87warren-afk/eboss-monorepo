-- Migration: gemini_travel_schema
-- Description: Tables for User Travel Profiles, Loyalty Programs, and Trip Itineraries

-- 1. Travel Profiles (PII Sensitive)
create table if not exists public.user_travel_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  home_airport_code text,
  passport_number_encrypted text, -- To be handled by app-side encryption ideally
  known_traveler_number text,
  seating_preference text check (seating_preference in ('aisle', 'window', 'any')),
  meal_preference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Loyalty Programs
create table if not exists public.user_loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  provider_type text check (provider_type in ('airline', 'hotel', 'car')),
  provider_name text not null, -- e.g., 'Delta', 'Marriott'
  member_number text not null,
  status_level text, -- e.g., 'Gold', 'Platinum'
  created_at timestamptz default now()
);

-- 3. Trips (Linked to Calendar)
create table if not exists public.travel_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  calendar_event_id text, -- External ID from Outlook/Google
  destination_city text not null,
  destination_airport_code text,
  trip_start_date date not null,
  trip_end_date date not null,
  status text check (status in ('draft', 'proposed', 'booked', 'completed', 'cancelled')) default 'draft',
  reason text, -- 'Client Meeting', 'Conference'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Trip Bookings (Specific Flight/Hotel details)
create table if not exists public.trip_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.travel_trips(id) on delete cascade not null,
  type text check (type in ('flight', 'hotel', 'car')),
  provider text, -- 'Delta', 'Hilton'
  confirmation_number text,
  details jsonb, -- Flexible JSON for flight times, gate, room type
  cost decimal(10, 2),
  status text default 'pending',
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.user_travel_profiles enable row level security;
alter table public.user_loyalty_programs enable row level security;
alter table public.travel_trips enable row level security;
alter table public.trip_bookings enable row level security;

-- Policy: Users can only see their own data
create policy "Users can view own travel profile" on public.user_travel_profiles for select using (auth.uid() = user_id);
create policy "Users can update own travel profile" on public.user_travel_profiles for update using (auth.uid() = user_id);
create policy "Users can insert own travel profile" on public.user_travel_profiles for insert with check (auth.uid() = user_id);

create policy "Users can view own loyalty" on public.user_loyalty_programs for select using (auth.uid() = user_id);
create policy "Users can manage own loyalty" on public.user_loyalty_programs for all using (auth.uid() = user_id);

create policy "Users can view own trips" on public.travel_trips for select using (auth.uid() = user_id);
create policy "Users can manage own trips" on public.travel_trips for all using (auth.uid() = user_id);

create policy "Users can view own bookings" on public.trip_bookings for select using ( exists (select 1 from public.travel_trips where id = trip_bindings.trip_id and user_id = auth.uid()) );
