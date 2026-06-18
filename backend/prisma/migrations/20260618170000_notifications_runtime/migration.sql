DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'type'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN type TYPE TEXT USING type::TEXT;
  END IF;
END
$$;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS actor_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS action_status TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS related_url TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ(6);

UPDATE public.notifications
SET
  title = coalesce(
    nullif(btrim(title), ''),
    CASE upper(coalesce(type, 'SYSTEM'))
      WHEN 'MATCH' THEN 'Eşleşme bildirimi'
      WHEN 'MESSAGE' THEN 'Yeni mesaj'
      WHEN 'SESSION' THEN 'Görüşme bildirimi'
      WHEN 'FEEDBACK' THEN 'Geri bildirim'
      ELSE 'Bildirim'
    END
  ),
  message = coalesce(
    nullif(btrim(message), ''),
    nullif(btrim(description), ''),
    nullif(btrim(content), ''),
    ''
  ),
  description = coalesce(
    nullif(btrim(description), ''),
    nullif(btrim(message), ''),
    nullif(btrim(content), ''),
    ''
  ),
  content = coalesce(
    nullif(btrim(content), ''),
    nullif(btrim(message), ''),
    nullif(btrim(description), ''),
    ''
  ),
  action_status = CASE
    WHEN lower(coalesce(action_status, 'none'))
      IN ('none', 'pending', 'accepted', 'declined', 'cancelled')
      THEN lower(coalesce(action_status, 'none'))
    ELSE 'none'
  END,
  metadata = coalesce(metadata, '{}'::jsonb),
  is_read = coalesce(is_read, false),
  created_at = coalesce(created_at, now());

ALTER TABLE public.notifications
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN message SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN action_status SET DEFAULT 'none',
  ALTER COLUMN action_status SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN is_read SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_action_status_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_action_status_check
  CHECK (action_status IN ('none', 'pending', 'accepted', 'declined', 'cancelled'));

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_session_action_idx
  ON public.notifications ((metadata ->> 'sessionId'), action_status)
  WHERE upper(type) = 'SESSION';

CREATE OR REPLACE FUNCTION public.sync_notification_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.title = coalesce(nullif(btrim(NEW.title), ''), 'Bildirim');
  NEW.message = coalesce(
    nullif(btrim(NEW.message), ''),
    nullif(btrim(NEW.description), ''),
    nullif(btrim(NEW.content), ''),
    ''
  );
  NEW.description = coalesce(
    nullif(btrim(NEW.description), ''),
    NEW.message,
    ''
  );
  NEW.content = coalesce(
    nullif(btrim(NEW.content), ''),
    NEW.message,
    ''
  );
  NEW.action_status = coalesce(nullif(lower(NEW.action_status), ''), 'none');
  NEW.metadata = coalesce(NEW.metadata, '{}'::jsonb);
  NEW.is_read = coalesce(NEW.is_read, false);

  IF NEW.is_read = true AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  ELSIF NEW.is_read = false THEN
    NEW.read_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_notification_columns ON public.notifications;
CREATE TRIGGER sync_notification_columns
BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.sync_notification_columns();

CREATE OR REPLACE FUNCTION public.notify_message_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  sender_avatar TEXT;
  message_preview TEXT;
BEGIN
  IF NEW.sender_id IS NULL
    OR NEW.receiver_id IS NULL
    OR NEW.sender_id = NEW.receiver_id
  THEN
    RETURN NEW;
  END IF;

  SELECT
    coalesce(
      nullif(btrim(full_name), ''),
      nullif(btrim(concat_ws(' ', first_name, last_name)), ''),
      'SkillBridge Kullanıcısı'
    ),
    avatar_url
  INTO sender_name, sender_avatar
  FROM public.profiles
  WHERE id = NEW.sender_id;

  message_preview = left(coalesce(nullif(btrim(NEW.content), ''), 'Yeni bir mesajın var.'), 180);

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    description,
    type,
    content,
    actor_name,
    actor_avatar_url,
    action_status,
    metadata,
    related_url
  )
  VALUES (
    NEW.receiver_id,
    'Yeni mesaj',
    message_preview,
    message_preview,
    'MESSAGE',
    message_preview,
    sender_name,
    sender_avatar,
    'none',
    jsonb_build_object(
      'messageId', NEW.id,
      'peerId', NEW.sender_id,
      'senderId', NEW.sender_id
    ),
    'messages'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_message_recipient ON public.messages;
CREATE TRIGGER notify_message_recipient
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_message_recipient();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notification state" ON public.notifications;

CREATE POLICY "Users can update own notification state"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE (is_read, read_at, dismissed_at)
  ON TABLE public.notifications
  TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;
