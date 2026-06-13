-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "UserSkillType" AS ENUM ('TEACH', 'LEARN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH', 'MESSAGE', 'SESSION', 'FEEDBACK', 'SYSTEM');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "full_name" TEXT NOT NULL DEFAULT '',
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "avatar_url" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "school" TEXT NOT NULL DEFAULT '',
    "university" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "profession" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'both',
    "profile_public" BOOLEAN NOT NULL DEFAULT true,
    "location_visible" BOOLEAN NOT NULL DEFAULT true,
    "show_online" BOOLEAN NOT NULL DEFAULT true,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "skill_points" INTEGER NOT NULL DEFAULT 0,
    "trust_score" DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "next_level_points" INTEGER NOT NULL DEFAULT 550,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "type" "UserSkillType" NOT NULL DEFAULT 'TEACH',
    "level" TEXT NOT NULL DEFAULT 'Beginner',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'teaches',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sessions_completed" INTEGER NOT NULL DEFAULT 0,
    "hours_total" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#4338ca',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requester_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "matched_user_id" UUID,
    "skill_name" TEXT NOT NULL DEFAULT '',
    "matched_skill_name" TEXT NOT NULL DEFAULT '',
    "match_score" INTEGER NOT NULL DEFAULT 0,
    "distance_km" DECIMAL(6,2),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "meeting_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skill_name" TEXT NOT NULL DEFAULT '',
    "mentor_id" UUID,
    "learner_id" UUID,
    "delivery_type" TEXT NOT NULL DEFAULT 'video',
    "color" TEXT NOT NULL DEFAULT '#4338ca',
    "emoji" TEXT NOT NULL DEFAULT 'book',

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewed_user_id" UUID NOT NULL,
    "reviewee_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL DEFAULT '',
    "actor_name" TEXT,
    "actor_avatar_url" TEXT,
    "action_status" TEXT NOT NULL DEFAULT 'none',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMPTZ(6),
    "dismissed_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "skill_id" UUID,
    "skill_name" TEXT NOT NULL DEFAULT '',
    "activity_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activity_type" TEXT NOT NULL DEFAULT 'learning',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "description" TEXT NOT NULL DEFAULT '',
    "related_session_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "progress_current" INTEGER NOT NULL DEFAULT 0,
    "progress_target" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "achieved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profiles_public_points_idx" ON "profiles"("profile_public", "skill_points" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_name_idx" ON "skills"("category", "name");

-- CreateIndex
CREATE INDEX "user_skills_user_type_order_idx" ON "user_skills"("user_id", "type", "sort_order", "created_at");

-- CreateIndex
CREATE INDEX "user_skills_user_kind_order_idx" ON "user_skills"("user_id", "kind", "sort_order", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_user_skill_type_idx" ON "user_skills"("user_id", "skill_id", "type");

-- CreateIndex
CREATE INDEX "matches_requester_created_idx" ON "matches"("requester_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "matches_receiver_created_idx" ON "matches"("receiver_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "matches_user_created_idx" ON "matches"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "matches_matched_user_created_idx" ON "matches"("matched_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "matches_skill_status_idx" ON "matches"("skill_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_match_id_key" ON "conversations"("match_id");

-- CreateIndex
CREATE INDEX "conversations_created_idx" ON "conversations"("created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_conversation_created_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_created_idx" ON "messages"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "sessions_match_scheduled_idx" ON "sessions"("match_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "sessions_mentor_scheduled_idx" ON "sessions"("mentor_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "sessions_learner_scheduled_idx" ON "sessions"("learner_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "feedback_reviewed_user_created_idx" ON "reviews"("reviewed_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_reviewee_created_idx" ON "reviews"("reviewee_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_created_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_read_created_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_visible_idx" ON "notifications"("user_id", "dismissed_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "learning_activity_user_date_idx" ON "learning_activity"("user_id", "activity_date");

-- CreateIndex
CREATE INDEX "point_events_user_occurred_idx" ON "point_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "user_achievements_user_active_idx" ON "user_achievements"("user_id", "is_active", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_activity" ADD CONSTRAINT "learning_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_activity" ADD CONSTRAINT "learning_activity_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "user_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_related_session_id_fkey" FOREIGN KEY ("related_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase Auth profile ownership
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_fkey" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain constraints that Prisma cannot currently express.
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_check" CHECK ("role" IN ('mentor', 'learner', 'both'));
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_skill_points_check" CHECK ("skill_points" >= 0);
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_trust_score_check" CHECK ("trust_score" >= 0 AND "trust_score" <= 10);
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_streak_days_check" CHECK ("streak_days" >= 0);
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_next_level_points_check" CHECK ("next_level_points" >= 0);
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_progress_check" CHECK ("progress" >= 0 AND "progress" <= 100);
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_sessions_completed_check" CHECK ("sessions_completed" >= 0);
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_hours_total_check" CHECK ("hours_total" >= 0);
ALTER TABLE "matches" ADD CONSTRAINT "matches_distinct_users_check" CHECK ("requester_id" <> "receiver_id");
ALTER TABLE "matches" ADD CONSTRAINT "matches_match_score_check" CHECK ("match_score" >= 0 AND "match_score" <= 100);
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_duration_minutes_check" CHECK ("duration_minutes" > 0);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_distinct_users_check" CHECK ("reviewer_id" <> "reviewed_user_id");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
ALTER TABLE "learning_activity" ADD CONSTRAINT "learning_activity_hours_check" CHECK ("hours" >= 0);
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_progress_current_check" CHECK ("progress_current" >= 0);
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_progress_target_check" CHECK ("progress_target" > 0);
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_action_status_check" CHECK ("action_status" IN ('none', 'pending', 'accepted', 'declined'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.first_name = coalesce(NEW.first_name, '');
  NEW.last_name = coalesce(NEW.last_name, '');
  NEW.full_name = coalesce(nullif(btrim(NEW.full_name), ''), btrim(concat_ws(' ', NEW.first_name, NEW.last_name)));
  NEW.school = coalesce(nullif(btrim(NEW.school), ''), NEW.university, '');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_skill_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_skill_id uuid;
  selected_skill_name text;
BEGIN
  IF lower(coalesce(NEW.kind, '')) IN ('learn', 'learns') THEN
    NEW.type = 'LEARN'::"UserSkillType";
    NEW.kind = 'learns';
  ELSIF NEW.type = 'LEARN'::"UserSkillType" THEN
    NEW.kind = 'learns';
  ELSE
    NEW.type = 'TEACH'::"UserSkillType";
    NEW.kind = 'teaches';
  END IF;

  selected_skill_name = nullif(btrim(coalesce(NEW.name, '')), '');

  IF NEW.skill_id IS NULL THEN
    IF selected_skill_name IS NULL THEN
      RAISE EXCEPTION 'user_skills requires either skill_id or name';
    END IF;

    INSERT INTO public.skills (name)
    VALUES (selected_skill_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO selected_skill_id;

    NEW.skill_id = selected_skill_id;
  ELSE
    SELECT name INTO selected_skill_name
    FROM public.skills
    WHERE id = NEW.skill_id;
  END IF;

  NEW.name = coalesce(nullif(btrim(coalesce(NEW.name, '')), ''), selected_skill_name, '');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_match_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  selected_skill_name text;
BEGIN
  SELECT name INTO selected_skill_name
  FROM public.skills
  WHERE id = NEW.skill_id;

  NEW.user_id = coalesce(NEW.user_id, NEW.requester_id);
  NEW.matched_user_id = coalesce(NEW.matched_user_id, NEW.receiver_id);
  NEW.skill_name = coalesce(nullif(btrim(NEW.skill_name), ''), selected_skill_name, '');
  NEW.matched_skill_name = coalesce(nullif(btrim(NEW.matched_skill_name), ''), selected_skill_name, '');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_session_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  match_requester_id uuid;
  match_receiver_id uuid;
  selected_skill_name text;
BEGIN
  SELECT m.requester_id, m.receiver_id, s.name
  INTO match_requester_id, match_receiver_id, selected_skill_name
  FROM public.matches m
  JOIN public.skills s ON s.id = m.skill_id
  WHERE m.id = NEW.match_id;

  NEW.mentor_id = coalesce(NEW.mentor_id, match_requester_id);
  NEW.learner_id = coalesce(NEW.learner_id, match_receiver_id);
  NEW.skill_name = coalesce(nullif(btrim(NEW.skill_name), ''), selected_skill_name, '');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_feedback_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.reviewee_id = coalesce(NEW.reviewee_id, NEW.reviewed_user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_notification_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.message = coalesce(nullif(btrim(NEW.message), ''), NEW.description, '');
  NEW.description = coalesce(nullif(btrim(NEW.description), ''), NEW.message, '');

  IF NEW.is_read = true AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_user_skills_updated_at ON public.user_skills;
CREATE TRIGGER set_user_skills_updated_at BEFORE UPDATE ON public.user_skills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_matches_updated_at ON public.matches;
CREATE TRIGGER set_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_conversations_updated_at ON public.conversations;
CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_sessions_updated_at ON public.sessions;
CREATE TRIGGER set_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_user_achievements_updated_at ON public.user_achievements;
CREATE TRIGGER set_user_achievements_updated_at BEFORE UPDATE ON public.user_achievements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS sync_profile_columns ON public.profiles;
CREATE TRIGGER sync_profile_columns BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_profile_columns();
DROP TRIGGER IF EXISTS sync_user_skill_columns ON public.user_skills;
CREATE TRIGGER sync_user_skill_columns BEFORE INSERT OR UPDATE ON public.user_skills FOR EACH ROW EXECUTE FUNCTION public.sync_user_skill_columns();
DROP TRIGGER IF EXISTS sync_match_columns ON public.matches;
CREATE TRIGGER sync_match_columns BEFORE INSERT OR UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.sync_match_columns();
DROP TRIGGER IF EXISTS sync_session_columns ON public.sessions;
CREATE TRIGGER sync_session_columns BEFORE INSERT OR UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.sync_session_columns();
DROP TRIGGER IF EXISTS sync_feedback_columns ON public.reviews;
CREATE TRIGGER sync_feedback_columns BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.sync_feedback_columns();
DROP TRIGGER IF EXISTS sync_notification_columns ON public.notifications;
CREATE TRIGGER sync_notification_columns BEFORE INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.sync_notification_columns();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    university,
    school,
    department,
    location,
    bio,
    role
  )
  VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    coalesce(NEW.raw_user_meta_data ->> 'first_name', ''),
    coalesce(NEW.raw_user_meta_data ->> 'last_name', ''),
    btrim(concat_ws(' ', NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name')),
    coalesce(NEW.raw_user_meta_data ->> 'university', ''),
    coalesce(NEW.raw_user_meta_data ->> 'university', ''),
    coalesce(NEW.raw_user_meta_data ->> 'department', ''),
    coalesce(NEW.raw_user_meta_data ->> 'location', ''),
    coalesce(NEW.raw_user_meta_data ->> 'bio', ''),
    coalesce(nullif(NEW.raw_user_meta_data ->> 'role', ''), 'both')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    university = EXCLUDED.university,
    school = EXCLUDED.school,
    department = EXCLUDED.department,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    role = EXCLUDED.role,
    updated_at = now();

  WITH incoming AS (
    SELECT DISTINCT ON (btrim(skill_name))
      btrim(skill_name) AS name,
      ordinality::integer AS sort_order
    FROM jsonb_array_elements_text(coalesce(NEW.raw_user_meta_data -> 'teaches', '[]'::jsonb))
      WITH ORDINALITY AS skills(skill_name, ordinality)
    WHERE btrim(skill_name) <> ''
  ),
  upserted AS (
    INSERT INTO public.skills (name)
    SELECT name FROM incoming
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  )
  INSERT INTO public.user_skills (user_id, skill_id, name, type, kind, sort_order)
  SELECT NEW.id, upserted.id, upserted.name, 'TEACH'::"UserSkillType", 'teaches', incoming.sort_order
  FROM incoming
  JOIN upserted ON upserted.name = incoming.name
  ON CONFLICT ("user_id", "skill_id", "type") DO NOTHING;

  WITH incoming AS (
    SELECT DISTINCT ON (btrim(skill_name))
      btrim(skill_name) AS name,
      ordinality::integer AS sort_order
    FROM jsonb_array_elements_text(coalesce(NEW.raw_user_meta_data -> 'learns', '[]'::jsonb))
      WITH ORDINALITY AS skills(skill_name, ordinality)
    WHERE btrim(skill_name) <> ''
  ),
  upserted AS (
    INSERT INTO public.skills (name)
    SELECT name FROM incoming
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  )
  INSERT INTO public.user_skills (user_id, skill_id, name, type, kind, sort_order)
  SELECT NEW.id, upserted.id, upserted.name, 'LEARN'::"UserSkillType", 'learns', incoming.sort_order
  FROM incoming
  JOIN upserted ON upserted.name = incoming.name
  ON CONFLICT ("user_id", "skill_id", "type") DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by owner, public profile, or connected users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR profile_public = true
    OR EXISTS (
      SELECT 1 FROM public.matches
      WHERE (matches.requester_id = (select auth.uid()) AND matches.receiver_id = profiles.id)
         OR (matches.receiver_id = (select auth.uid()) AND matches.requester_id = profiles.id)
         OR (matches.user_id = (select auth.uid()) AND matches.matched_user_id = profiles.id)
         OR (matches.matched_user_id = (select auth.uid()) AND matches.user_id = profiles.id)
    )
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Authenticated users can read skills"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create skills"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Skills readable by owner or public profile"
  ON public.user_skills
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = user_skills.user_id
        AND profiles.profile_public = true
    )
  );

CREATE POLICY "Users can insert own user skills"
  ON public.user_skills
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own user skills"
  ON public.user_skills
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own user skills"
  ON public.user_skills
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Match participants can read matches"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IN (requester_id, receiver_id) OR (select auth.uid()) IN (user_id, matched_user_id));

CREATE POLICY "Users can insert requested matches"
  ON public.matches
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = requester_id);

CREATE POLICY "Match participants can update matches"
  ON public.matches
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IN (requester_id, receiver_id) OR (select auth.uid()) IN (user_id, matched_user_id))
  WITH CHECK ((select auth.uid()) IN (requester_id, receiver_id) OR (select auth.uid()) IN (user_id, matched_user_id));

CREATE POLICY "Match requesters can delete matches"
  ON public.matches
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = requester_id OR (select auth.uid()) = user_id);

CREATE POLICY "Conversation participants can read conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = conversations.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Conversation participants can insert conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = conversations.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Conversation participants can update conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = conversations.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = conversations.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Conversation participants can read messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations
      JOIN public.matches ON matches.id = conversations.match_id
      WHERE conversations.id = messages.conversation_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1
      FROM public.conversations
      JOIN public.matches ON matches.id = conversations.match_id
      WHERE conversations.id = messages.conversation_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Conversation participants can update messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations
      JOIN public.matches ON matches.id = conversations.match_id
      WHERE conversations.id = messages.conversation_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.conversations
      JOIN public.matches ON matches.id = conversations.match_id
      WHERE conversations.id = messages.conversation_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Session participants can read sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) IN (mentor_id, learner_id)
    OR EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = sessions.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Session participants can insert sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = sessions.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Session participants can update sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) IN (mentor_id, learner_id)
    OR EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = sessions.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  )
  WITH CHECK (
    (select auth.uid()) IN (mentor_id, learner_id)
    OR EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = sessions.match_id
        AND ((select auth.uid()) IN (matches.requester_id, matches.receiver_id) OR (select auth.uid()) IN (matches.user_id, matches.matched_user_id))
    )
  );

CREATE POLICY "Feedback participants can read feedback"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IN (reviewer_id, reviewed_user_id, reviewee_id));

CREATE POLICY "Users can insert feedback they wrote"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reviewer_id);

CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can read own learning activity"
  ON public.learning_activity
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own learning activity"
  ON public.learning_activity
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own learning activity"
  ON public.learning_activity
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own learning activity"
  ON public.learning_activity
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can read own point events"
  ON public.point_events
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own point events"
  ON public.point_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can read own achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.user_achievements
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own achievements"
  ON public.user_achievements
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.skills FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_skills FROM anon, authenticated;
REVOKE ALL ON TABLE public.matches FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversations FROM anon, authenticated;
REVOKE ALL ON TABLE public.messages FROM anon, authenticated;
REVOKE ALL ON TABLE public.sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.reviews FROM anon, authenticated;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
REVOKE ALL ON TABLE public.learning_activity FROM anon, authenticated;
REVOKE ALL ON TABLE public.point_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_achievements FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT ON TABLE public.skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.matches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sessions TO authenticated;
GRANT SELECT, INSERT ON TABLE public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learning_activity TO authenticated;
GRANT SELECT, INSERT ON TABLE public.point_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_achievements TO authenticated;
