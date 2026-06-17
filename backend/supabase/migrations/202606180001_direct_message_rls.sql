-- Align messages RLS with the live direct-message schema.
-- The current frontend uses public.messages(sender_id, receiver_id, content, is_read)
-- directly through the Supabase client for realtime chat.

alter table public.messages enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Direct message participants can read messages'
  ) then
    create policy "Direct message participants can read messages"
      on public.messages
      for select
      to authenticated
      using (
        (select auth.uid()) = sender_id
        or (select auth.uid()) = receiver_id
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Authenticated users can send direct messages'
  ) then
    create policy "Authenticated users can send direct messages"
      on public.messages
      for insert
      to authenticated
      with check (
        (select auth.uid()) = sender_id
        and receiver_id is not null
        and content is not null
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Direct message participants can update read state'
  ) then
    create policy "Direct message participants can update read state"
      on public.messages
      for update
      to authenticated
      using (
        (select auth.uid()) = sender_id
        or (select auth.uid()) = receiver_id
      )
      with check (
        (select auth.uid()) = sender_id
        or (select auth.uid()) = receiver_id
      );
  end if;
end $$;

grant select, insert, update on table public.messages to authenticated;
