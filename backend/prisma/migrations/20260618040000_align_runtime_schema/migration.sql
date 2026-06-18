-- Reconcile the original Prisma baseline with the schema used by the current
-- Supabase-first realtime frontend. Every operation is safe when the live
-- schema is already aligned.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teaches TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS learns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.profiles
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL,
  ALTER COLUMN university DROP NOT NULL,
  ALTER COLUMN department DROP NOT NULL,
  ALTER COLUMN bio DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID,
  receiver_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS connections_requester_receiver_idx
  ON public.connections (requester_id, receiver_id);
CREATE INDEX IF NOT EXISTS connections_receiver_status_created_idx
  ON public.connections (receiver_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS connections_requester_created_idx
  ON public.connections (requester_id, created_at DESC);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS receiver_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'conversation_id'
  ) THEN
    UPDATE public.messages AS message
    SET receiver_id = CASE
      WHEN message.sender_id = match.requester_id THEN match.receiver_id
      ELSE match.requester_id
    END
    FROM public.conversations AS conversation
    JOIN public.matches AS match ON match.id = conversation.match_id
    WHERE message.conversation_id = conversation.id
      AND message.receiver_id IS NULL;

    ALTER TABLE public.messages
      DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
    DROP INDEX IF EXISTS public.messages_conversation_created_idx;
    ALTER TABLE public.messages DROP COLUMN conversation_id;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS messages_receiver_read_created_idx
  ON public.messages (receiver_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_pair_created_idx
  ON public.messages (sender_id, receiver_id, created_at);

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS student_id UUID,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'match_id'
  ) THEN
    ALTER TABLE public.sessions ALTER COLUMN match_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'meeting_url'
  ) THEN
    UPDATE public.sessions
    SET meeting_link = COALESCE(meeting_link, meeting_url)
    WHERE meeting_link IS NULL;
  END IF;

  UPDATE public.sessions
  SET student_id = learner_id
  WHERE student_id IS NULL;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matches'
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.matches ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.matches
      ALTER COLUMN status TYPE TEXT USING lower(status::TEXT);
    ALTER TABLE public.matches ALTER COLUMN status SET DEFAULT 'pending';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.sessions ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.sessions
      ALTER COLUMN status TYPE TEXT USING lower(status::TEXT);
    ALTER TABLE public.sessions ALTER COLUMN status SET DEFAULT 'scheduled';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'type'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN type TYPE TEXT USING lower(type::TEXT);
  END IF;
END
$$;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ(6);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'message'
  ) THEN
    UPDATE public.notifications
    SET content = COALESCE(content, message)
    WHERE content IS NULL;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'description'
  ) THEN
    UPDATE public.notifications
    SET content = COALESCE(content, description)
    WHERE content IS NULL;
  END IF;

  UPDATE public.notifications
  SET content = ''
  WHERE content IS NULL;
END
$$;

ALTER TABLE public.notifications
  ALTER COLUMN content SET NOT NULL;
