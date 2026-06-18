-- Keep direct messaging in Supabase while limiting every operation through RLS.

alter table public.messages enable row level security;

drop policy if exists "Kullanıcılar kendi gönderdikleri veya aldıkları mesajları"
  on public.messages;
drop policy if exists "Kullanıcılar sadece kendi adlarına mesaj gönderebilir"
  on public.messages;
drop policy if exists "Direct message participants can read messages"
  on public.messages;
drop policy if exists "Authenticated users can send direct messages"
  on public.messages;
drop policy if exists "Direct message participants can update read state"
  on public.messages;
drop policy if exists "Message receivers can update read state"
  on public.messages;

create policy "Direct message participants can read messages"
  on public.messages
  for select
  to authenticated
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
  );

create policy "Authenticated users can send direct messages"
  on public.messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) = sender_id
    and receiver_id is not null
    and receiver_id <> sender_id
    and nullif(btrim(content), '') is not null
  );

create policy "Message receivers can update read state"
  on public.messages
  for update
  to authenticated
  using ((select auth.uid()) = receiver_id)
  with check ((select auth.uid()) = receiver_id);

revoke all on table public.messages from authenticated;
grant select, insert on table public.messages to authenticated;
grant update (is_read) on table public.messages to authenticated;
