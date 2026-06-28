create table if not exists public.cases (
  id text primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cases enable row level security;

create policy if not exists "Users can view own cases"
  on public.cases for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own cases"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own cases"
  on public.cases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Users can delete own cases"
  on public.cases for delete
  using (auth.uid() = user_id);
