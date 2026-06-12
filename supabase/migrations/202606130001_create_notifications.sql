create extension if not exists pgcrypto with schema extensions;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in ('match', 'message', 'session', 'achievement', 'points', 'review', 'suggestion')
  ),
  title text not null,
  description text not null,
  actor_name text,
  actor_avatar_url text,
  action_status text not null default 'none' check (
    action_status in ('none', 'pending', 'accepted', 'declined')
  ),
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_visible_idx
  on public.notifications (user_id, dismissed_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
  on public.notifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on table public.notifications from anon, authenticated;
grant select, insert on table public.notifications to authenticated;
grant update (read_at, dismissed_at, action_status) on table public.notifications to authenticated;
