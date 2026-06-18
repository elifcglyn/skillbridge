UPDATE public.sessions
SET duration_minutes = 60
WHERE duration_minutes IS NULL
   OR duration_minutes NOT IN (30, 45, 60, 90);

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_duration_minutes_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_duration_minutes_check
  CHECK (duration_minutes IN (30, 45, 60, 90));

CREATE INDEX IF NOT EXISTS sessions_active_mentor_time_idx
  ON public.sessions (mentor_id, scheduled_at)
  WHERE lower(status) IN ('pending', 'scheduled');

CREATE INDEX IF NOT EXISTS sessions_active_learner_time_idx
  ON public.sessions (learner_id, scheduled_at)
  WHERE lower(status) IN ('pending', 'scheduled');

CREATE INDEX IF NOT EXISTS sessions_active_student_time_idx
  ON public.sessions (student_id, scheduled_at)
  WHERE lower(status) IN ('pending', 'scheduled');
