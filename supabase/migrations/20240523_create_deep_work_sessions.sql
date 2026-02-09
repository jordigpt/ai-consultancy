create table if not exists public.deep_work_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.deep_work_sessions enable row level security;

create policy "Users can view their own deep work sessions"
on public.deep_work_sessions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own deep work sessions"
on public.deep_work_sessions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own deep work sessions"
on public.deep_work_sessions for delete
to authenticated
using (auth.uid() = user_id);