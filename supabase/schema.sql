create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  event_type text not null check (event_type in ('sleep', 'wake')),
  event_time timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Users can view own events"
on public.events
for select
using (user_id = auth.uid());

create policy "Users can insert own events"
on public.events
for insert
with check (user_id = auth.uid());

create policy "Users can delete own events"
on public.events
for delete
using (user_id = auth.uid());

create index if not exists events_user_event_time_idx
on public.events (user_id, event_time);
