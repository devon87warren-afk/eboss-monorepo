-- Create the savings_entries table
create table if not exists public.savings_entries (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  runtime_hours integer not null,
  fuel_price numeric not null,
  project_days integer not null,
  cost_saved numeric not null,
  co2_saved_tons numeric not null,
  trees_planted integer not null,
  
  -- If you have auth, you might want to link to a user:
  -- user_id uuid references auth.users(id),

  constraint savings_entries_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.savings_entries enable row level security;

-- Create Policy: Allow public read access (for now, or authenticated)
create policy "Allow public read access"
  on public.savings_entries
  for select
  using (true);

-- Create Policy: Allow public insert access (for demo purposes)
-- WARN: In production, you might want to restrict this to authenticated users only.
create policy "Allow public insert access"
  on public.savings_entries
  for insert
  with check (true);
