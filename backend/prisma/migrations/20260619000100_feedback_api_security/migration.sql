CREATE INDEX IF NOT EXISTS reviews_reviewee_created_idx
  ON public.reviews (reviewee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_reviewer_created_idx
  ON public.reviews (reviewer_id, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Değerlendirmeleri herkes okuyabilir"
  ON public.reviews;
DROP POLICY IF EXISTS "Review participants can read reviews"
  ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews they wrote"
  ON public.reviews;
DROP POLICY IF EXISTS "Kullanıcılar kendi değerlendirmelerini yazabilir"
  ON public.reviews;

CREATE POLICY "Review participants can read reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = reviewer_id
    OR (select auth.uid()) = reviewee_id
  );

REVOKE ALL ON TABLE public.reviews FROM anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO authenticated;

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
      AND tablename = 'reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;
END
$$;
