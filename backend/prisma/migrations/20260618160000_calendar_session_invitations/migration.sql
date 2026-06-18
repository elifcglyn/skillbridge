-- Calendar invitations use an explicit approval lifecycle and are mutated only
-- through the authenticated Express API.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS match_id UUID;

UPDATE public.sessions
SET status = lower(coalesce(status::text, 'scheduled'));

UPDATE public.sessions
SET status = 'scheduled'
WHERE status NOT IN ('pending', 'scheduled', 'declined', 'cancelled', 'completed');

ALTER TABLE public.sessions
  ALTER COLUMN status TYPE TEXT USING lower(status::text),
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'scheduled', 'declined', 'cancelled', 'completed'));

CREATE INDEX IF NOT EXISTS sessions_match_scheduled_idx
  ON public.sessions (match_id, scheduled_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_match_id_fkey'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_match_id_fkey
      FOREIGN KEY (match_id)
      REFERENCES public.matches(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Session participants can insert sessions"
  ON public.sessions;
DROP POLICY IF EXISTS "Session participants can update sessions"
  ON public.sessions;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.sessions FROM authenticated;
GRANT SELECT ON TABLE public.sessions TO authenticated;
