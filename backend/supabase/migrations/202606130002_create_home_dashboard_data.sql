create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  university text not null default '',
  department text not null default '',
  location text not null default '',
  bio text not null default '',
  role text not null default 'both' check (role in ('mentor', 'learner', 'both')),
  avatar_url text,
  profile_public boolean not null default true,
  location_visible boolean not null default true,
  show_online boolean not null default true,
  is_online boolean not null default false,
  skill_points integer not null default 0 check (skill_points >= 0),
  trust_score numeric(3, 1) not null default 0 check (trust_score >= 0 and trust_score <= 10),
  streak_days integer not null default 0 check (streak_days >= 0),
  next_level_points integer not null default 550 check (next_level_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('teaches', 'learns', 'active')),
  level text not null default 'Beginner',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  hours_total numeric(6, 2) not null default 0 check (hours_total >= 0),
  color text not null default '#4338ca',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  matched_user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null default '',
  matched_skill_name text not null default '',
  status text not null default 'recommended' check (
    status in ('recommended', 'pending', 'accepted', 'declined', 'nearby')
  ),
  match_score integer not null default 0 check (match_score >= 0 and match_score <= 100),
  distance_km numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id <> matched_user_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  skill_name text not null default '',
  mentor_id uuid not null references auth.users(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  delivery_type text not null default 'video' check (delivery_type in ('video', 'in_person', 'campus')),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  color text not null default '#4338ca',
  emoji text not null default '📚',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mentor_id <> learner_id)
);

create table if not exists public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.user_skills(id) on delete set null,
  skill_name text not null default '',
  activity_date date not null default current_date,
  hours numeric(5, 2) not null default 0 check (hours >= 0),
  activity_type text not null default 'learning',
  created_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null,
  source text not null default 'manual',
  description text not null default '',
  related_session_id uuid references public.sessions(id) on delete set null,
  occurred_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  rating numeric(2, 1) not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  check (reviewer_id <> reviewee_id)
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_target integer not null default 1 check (progress_target > 0),
  color text not null default '#f59e0b',
  is_active boolean not null default true,
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_public_points_idx
  on public.profiles (profile_public, skill_points desc);

create unique index if not exists user_skills_user_name_kind_idx
  on public.user_skills (user_id, lower(name), kind);

create index if not exists user_skills_user_kind_order_idx
  on public.user_skills (user_id, kind, sort_order, created_at);

create index if not exists matches_user_created_idx
  on public.matches (user_id, created_at desc);

create index if not exists matches_matched_user_created_idx
  on public.matches (matched_user_id, created_at desc);

create index if not exists sessions_mentor_scheduled_idx
  on public.sessions (mentor_id, scheduled_at);

create index if not exists sessions_learner_scheduled_idx
  on public.sessions (learner_id, scheduled_at);

create index if not exists learning_activity_user_date_idx
  on public.learning_activity (user_id, activity_date);

create index if not exists point_events_user_occurred_idx
  on public.point_events (user_id, occurred_at desc);

create index if not exists reviews_reviewee_created_idx
  on public.reviews (reviewee_id, created_at desc);

create index if not exists user_achievements_user_active_idx
  on public.user_achievements (user_id, is_active, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_skills_updated_at on public.user_skills;
create trigger set_user_skills_updated_at
  before update on public.user_skills
  for each row execute function public.set_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

drop trigger if exists set_sessions_updated_at on public.sessions;
create trigger set_sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_achievements_updated_at on public.user_achievements;
create trigger set_user_achievements_updated_at
  before update on public.user_achievements
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    university,
    department,
    location,
    bio,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'university', ''),
    coalesce(new.raw_user_meta_data ->> 'department', ''),
    coalesce(new.raw_user_meta_data ->> 'location', ''),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'both')
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    university = excluded.university,
    department = excluded.department,
    location = excluded.location,
    bio = excluded.bio,
    role = excluded.role,
    updated_at = now();

  insert into public.user_skills (user_id, name, kind, sort_order)
  select new.id, skill_name, 'teaches', ordinality::integer
  from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'teaches', '[]'::jsonb))
    with ordinality as skills(skill_name, ordinality)
  on conflict do nothing;

  insert into public.user_skills (user_id, name, kind, sort_order)
  select new.id, skill_name, 'learns', ordinality::integer
  from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'learns', '[]'::jsonb))
    with ordinality as skills(skill_name, ordinality)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.user_skills enable row level security;
alter table public.matches enable row level security;
alter table public.sessions enable row level security;
alter table public.learning_activity enable row level security;
alter table public.point_events enable row level security;
alter table public.reviews enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "Profiles readable by owner or public" on public.profiles;
create policy "Profiles readable by owner or public"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or profile_public = true
    or exists (
      select 1
      from public.matches
      where (
        matches.user_id = auth.uid()
        and matches.matched_user_id = profiles.id
      ) or (
        matches.matched_user_id = auth.uid()
        and matches.user_id = profiles.id
      )
    )
    or exists (
      select 1
      from public.sessions
      where (
        sessions.mentor_id = auth.uid()
        and sessions.learner_id = profiles.id
      ) or (
        sessions.learner_id = auth.uid()
        and sessions.mentor_id = profiles.id
      )
    )
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Skills readable by owner or public profile" on public.user_skills;
create policy "Skills readable by owner or public profile"
  on public.user_skills
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = user_skills.user_id
        and profiles.profile_public = true
    )
  );

drop policy if exists "Users can insert own skills" on public.user_skills;
create policy "Users can insert own skills"
  on public.user_skills
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own skills" on public.user_skills;
create policy "Users can update own skills"
  on public.user_skills
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own skills" on public.user_skills;
create policy "Users can delete own skills"
  on public.user_skills
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Match participants can read matches" on public.matches;
create policy "Match participants can read matches"
  on public.matches
  for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = matched_user_id);

drop policy if exists "Users can insert own match requests" on public.matches;
create policy "Users can insert own match requests"
  on public.matches
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Match participants can update matches" on public.matches;
create policy "Match participants can update matches"
  on public.matches
  for update
  to authenticated
  using (auth.uid() = user_id or auth.uid() = matched_user_id)
  with check (auth.uid() = user_id or auth.uid() = matched_user_id);

drop policy if exists "Users can delete own matches" on public.matches;
create policy "Users can delete own matches"
  on public.matches
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Session participants can read sessions" on public.sessions;
create policy "Session participants can read sessions"
  on public.sessions
  for select
  to authenticated
  using (auth.uid() = mentor_id or auth.uid() = learner_id);

drop policy if exists "Session participants can insert sessions" on public.sessions;
create policy "Session participants can insert sessions"
  on public.sessions
  for insert
  to authenticated
  with check (auth.uid() = mentor_id or auth.uid() = learner_id);

drop policy if exists "Session participants can update sessions" on public.sessions;
create policy "Session participants can update sessions"
  on public.sessions
  for update
  to authenticated
  using (auth.uid() = mentor_id or auth.uid() = learner_id)
  with check (auth.uid() = mentor_id or auth.uid() = learner_id);

drop policy if exists "Users can read own learning activity" on public.learning_activity;
create policy "Users can read own learning activity"
  on public.learning_activity
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own learning activity" on public.learning_activity;
create policy "Users can insert own learning activity"
  on public.learning_activity
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own learning activity" on public.learning_activity;
create policy "Users can update own learning activity"
  on public.learning_activity
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own learning activity" on public.learning_activity;
create policy "Users can delete own learning activity"
  on public.learning_activity
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read own point events" on public.point_events;
create policy "Users can read own point events"
  on public.point_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own point events" on public.point_events;
create policy "Users can insert own point events"
  on public.point_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Review participants can read reviews" on public.reviews;
create policy "Review participants can read reviews"
  on public.reviews
  for select
  to authenticated
  using (auth.uid() = reviewer_id or auth.uid() = reviewee_id);

drop policy if exists "Users can insert reviews they wrote" on public.reviews;
create policy "Users can insert reviews they wrote"
  on public.reviews
  for insert
  to authenticated
  with check (auth.uid() = reviewer_id);

drop policy if exists "Users can read own achievements" on public.user_achievements;
create policy "Users can read own achievements"
  on public.user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.user_achievements;
create policy "Users can insert own achievements"
  on public.user_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own achievements" on public.user_achievements;
create policy "Users can update own achievements"
  on public.user_achievements
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own achievements" on public.user_achievements;
create policy "Users can delete own achievements"
  on public.user_achievements
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_skills from anon, authenticated;
revoke all on table public.matches from anon, authenticated;
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.learning_activity from anon, authenticated;
revoke all on table public.point_events from anon, authenticated;
revoke all on table public.reviews from anon, authenticated;
revoke all on table public.user_achievements from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_skills to authenticated;
grant select, insert, update, delete on table public.matches to authenticated;
grant select, insert, update on table public.sessions to authenticated;
grant select, insert, update, delete on table public.learning_activity to authenticated;
grant select, insert on table public.point_events to authenticated;
grant select, insert on table public.reviews to authenticated;
grant select, insert, update, delete on table public.user_achievements to authenticated;
