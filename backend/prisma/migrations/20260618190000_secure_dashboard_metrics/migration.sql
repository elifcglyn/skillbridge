ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own learning activity"
  ON public.learning_activity;
DROP POLICY IF EXISTS "Users can update own learning activity"
  ON public.learning_activity;
DROP POLICY IF EXISTS "Users can delete own learning activity"
  ON public.learning_activity;

DROP POLICY IF EXISTS "Users can insert own point events"
  ON public.point_events;

DROP POLICY IF EXISTS "Users can insert own achievements"
  ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements"
  ON public.user_achievements;
DROP POLICY IF EXISTS "Users can delete own achievements"
  ON public.user_achievements;

DROP POLICY IF EXISTS "Users can read own learning activity"
  ON public.learning_activity;
CREATE POLICY "Users can read own learning activity"
  ON public.learning_activity
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own point events"
  ON public.point_events;
CREATE POLICY "Users can read own point events"
  ON public.point_events
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own achievements"
  ON public.user_achievements;
CREATE POLICY "Users can read own achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

REVOKE ALL ON TABLE public.learning_activity FROM anon, authenticated;
REVOKE ALL ON TABLE public.point_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_achievements FROM anon, authenticated;

GRANT SELECT ON TABLE public.learning_activity TO authenticated;
GRANT SELECT ON TABLE public.point_events TO authenticated;
GRANT SELECT ON TABLE public.user_achievements TO authenticated;
