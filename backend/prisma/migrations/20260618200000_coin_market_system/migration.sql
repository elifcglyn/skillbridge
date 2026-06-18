DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'point_events'
      AND column_name = 'points'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'point_events'
      AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.point_events RENAME COLUMN points TO amount;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'point_events'
      AND column_name = 'source'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'point_events'
      AND column_name = 'event_type'
  ) THEN
    ALTER TABLE public.point_events RENAME COLUMN source TO event_type;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'point_events'
      AND column_name = 'occurred_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'point_events'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.point_events RENAME COLUMN occurred_at TO created_at;
  END IF;
END
$$;

ALTER TABLE public.point_events
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_session_id UUID;

ALTER TABLE public.point_events
  ALTER COLUMN event_type SET DEFAULT 'manual',
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'point_events_related_session_id_fkey'
      AND conrelid = 'public.point_events'::regclass
  ) THEN
    ALTER TABLE public.point_events
      ADD CONSTRAINT point_events_related_session_id_fkey
      FOREIGN KEY (related_session_id)
      REFERENCES public.sessions(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'point_events_amount_nonzero_check'
      AND conrelid = 'public.point_events'::regclass
  ) THEN
    ALTER TABLE public.point_events
      ADD CONSTRAINT point_events_amount_nonzero_check CHECK (amount <> 0);
  END IF;
END
$$;

DROP INDEX IF EXISTS public.point_events_user_occurred_idx;
CREATE INDEX IF NOT EXISTS point_events_user_created_idx
  ON public.point_events (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS point_events_session_reward_unique_idx
  ON public.point_events (user_id, event_type, related_session_id)
  WHERE related_session_id IS NOT NULL
    AND event_type IN ('training_completed', 'training_taught');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coin_balance INTEGER NOT NULL DEFAULT 0;

UPDATE public.profiles
SET coin_balance = greatest(0, coalesce(skill_points, 0));

WITH ledger_totals AS (
  SELECT
    profiles.id AS user_id,
    profiles.coin_balance
      - coalesce(sum(point_events.amount), 0)::integer AS opening_amount
  FROM public.profiles
  LEFT JOIN public.point_events
    ON point_events.user_id = profiles.id
  GROUP BY profiles.id, profiles.coin_balance
)
INSERT INTO public.point_events (
  user_id,
  amount,
  event_type,
  description,
  created_at
)
SELECT
  user_id,
  opening_amount,
  'opening_balance',
  'Coin sistemi başlangıç bakiyesi',
  now()
FROM ledger_totals
WHERE opening_amount <> 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_coin_balance_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_coin_balance_check CHECK (coin_balance >= 0);
  END IF;
END
$$;

CREATE TABLE public.market_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  point_event_id UUID NOT NULL,
  cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT market_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT market_purchases_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT market_purchases_point_event_id_fkey
    FOREIGN KEY (point_event_id) REFERENCES public.point_events(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT market_purchases_point_event_id_key UNIQUE (point_event_id),
  CONSTRAINT market_purchases_user_idempotency_key
    UNIQUE (user_id, idempotency_key),
  CONSTRAINT market_purchases_cost_positive_check CHECK (cost > 0),
  CONSTRAINT market_purchases_status_check
    CHECK (status IN ('active', 'used', 'cancelled'))
);

CREATE INDEX market_purchases_user_created_idx
  ON public.market_purchases (user_id, created_at DESC);

ALTER TABLE public.market_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own market purchases"
  ON public.market_purchases
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

REVOKE ALL ON TABLE public.market_purchases FROM anon, authenticated;
GRANT SELECT ON TABLE public.market_purchases TO authenticated;

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
      AND tablename = 'market_purchases'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.market_purchases;
  END IF;
END
$$;
