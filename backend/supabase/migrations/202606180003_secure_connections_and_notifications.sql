-- Realtime connection requests are visible only to their participants.
-- Only the receiver can accept or reject a pending request.

alter table public.connections enable row level security;

drop policy if exists "Bağlantıları herkes görebilir"
  on public.connections;
drop policy if exists "Kullanıcılar kendi bağlantılarını yönetebilir"
  on public.connections;
drop policy if exists "Connection participants can read requests"
  on public.connections;
drop policy if exists "Users can create connection requests"
  on public.connections;
drop policy if exists "Connection receivers can answer requests"
  on public.connections;

create policy "Connection participants can read requests"
  on public.connections
  for select
  to authenticated
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = receiver_id
  );

create policy "Users can create connection requests"
  on public.connections
  for insert
  to authenticated
  with check (
    (select auth.uid()) = requester_id
    and receiver_id is not null
    and receiver_id <> requester_id
    and lower(coalesce(status, 'pending')) = 'pending'
  );

create policy "Connection receivers can answer requests"
  on public.connections
  for update
  to authenticated
  using ((select auth.uid()) = receiver_id)
  with check (
    (select auth.uid()) = receiver_id
    and lower(status) in ('accepted', 'rejected')
  );

revoke all on table public.connections from authenticated;
grant select, insert on table public.connections to authenticated;
grant update (status) on table public.connections to authenticated;

-- Notifications stay realtime, but clients may only read and update the
-- presentation state of their own rows. Inserts are reserved for trusted
-- database functions or backend/service-role processes.

alter table public.notifications enable row level security;

drop policy if exists "Kullanıcılar bildirimlerini güncelleyebilir (okundu yapmak i"
  on public.notifications;
drop policy if exists "Kullanıcılar sadece kendi bildirimlerini görebilir"
  on public.notifications;
drop policy if exists "Sistem herkese bildirim gönderebilir"
  on public.notifications;
drop policy if exists "Users can read own notifications"
  on public.notifications;
drop policy if exists "Users can insert own notifications"
  on public.notifications;
drop policy if exists "Users can update own notifications"
  on public.notifications;

create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update own notification state"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.notifications from authenticated;
grant select on table public.notifications to authenticated;
grant update (is_read, dismissed_at) on table public.notifications to authenticated;
