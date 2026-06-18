import { getPrismaClient } from "../lib/prisma.js";

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  university: string | null;
  department: string | null;
  teaches: string[] | null;
  learns: string[] | null;
  skill_points: number | null;
  coin_balance: number;
};

type SummaryRow = {
  completed_sessions: number;
  completed_this_week: number;
  teaching_minutes: number;
  teaching_minutes_this_week: number;
  weekly_points: number;
  trust_score: unknown;
  review_count: number;
};

type WeeklyLearningRow = {
  activity_date: Date;
  hours: unknown;
};

type UserSkillRow = {
  id: string;
  name: string;
  kind: string;
  progress: number;
  color: string;
  completed_sessions: number;
  completed_hours: unknown;
};

type AchievementRow = {
  id: string;
  title: string;
  description: string;
  progress_current: number;
  progress_target: number;
  color: string;
};

type SessionRow = {
  id: string;
  title: string | null;
  scheduled_at: Date;
  meeting_link: string | null;
  skill_name: string | null;
  color: string | null;
  emoji: string | null;
  peer_id: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
};

type MatchRow = {
  id: string;
  other_user_id: string;
  other_name: string | null;
  other_avatar_url: string | null;
  skill_name: string | null;
  distance_km: unknown;
  rating: unknown;
  review_count: number;
};

type LeaderboardRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  skill_points: number;
  rank: number;
};

type SidebarRow = {
  match_count: number;
  message_count: number;
  session_count: number;
  notification_count: number;
};

type StreakRow = {
  streak_days: number;
};

type SearchProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  university: string | null;
  department: string | null;
  avatar_url: string | null;
  matched: boolean;
};

type SearchSkillRow = {
  name: string;
  member_count: number;
};

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SKILL_COLORS = ["#4338ca", "#06b6d4", "#7c3aed", "#10b981"];

function getName(
  row?: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null,
) {
  const explicitName = row?.full_name?.trim();
  if (explicitName) return explicitName;

  const composedName = [row?.first_name, row?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composedName || "SkillBridge Kullanıcısı";
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function calculateLevelProgress(skillPoints: number) {
  const levelSize = 1000;
  const currentLevelStart = Math.floor(skillPoints / levelSize) * levelSize;
  const nextLevelPoints = currentLevelStart + levelSize;
  const progress = Math.min(
    100,
    Math.max(0, Math.round(((skillPoints - currentLevelStart) / levelSize) * 100)),
  );
  return {
    nextLevelPoints,
    pointsToNextLevel: Math.max(0, nextLevelPoints - skillPoints),
    progress,
  };
}

export async function getDashboard(userId: string) {
  const prisma = getPrismaClient();

  const [
    profiles,
    summaries,
    weeklyLearning,
    userSkills,
    achievements,
    upcomingSessions,
    recentMatches,
    leaderboard,
    sidebar,
    streak,
  ] = await Promise.all([
    prisma.$queryRaw<ProfileRow[]>`
      SELECT
        id,
        full_name,
        first_name,
        last_name,
        avatar_url,
        university,
        department,
        teaches,
        learns,
        skill_points,
        coin_balance
      FROM public.profiles
      WHERE id::text = ${userId}
      LIMIT 1;
    `,
    prisma.$queryRaw<SummaryRow[]>`
      SELECT
        (
          SELECT count(*)::int
          FROM public.sessions
          WHERE (
              mentor_id::text = ${userId}
              OR learner_id::text = ${userId}
              OR student_id::text = ${userId}
            )
            AND lower(coalesce(status, 'scheduled')) = 'completed'
        ) AS completed_sessions,
        (
          SELECT count(*)::int
          FROM public.sessions
          WHERE (
              mentor_id::text = ${userId}
              OR learner_id::text = ${userId}
              OR student_id::text = ${userId}
            )
            AND lower(coalesce(status, 'scheduled')) = 'completed'
            AND scheduled_at >= date_trunc('week', now())
        ) AS completed_this_week,
        (
          SELECT coalesce(sum(duration_minutes), 0)::int
          FROM public.sessions
          WHERE mentor_id::text = ${userId}
            AND lower(coalesce(status, 'scheduled')) = 'completed'
        ) AS teaching_minutes,
        (
          SELECT coalesce(sum(duration_minutes), 0)::int
          FROM public.sessions
          WHERE mentor_id::text = ${userId}
            AND lower(coalesce(status, 'scheduled')) = 'completed'
            AND scheduled_at >= date_trunc('week', now())
        ) AS teaching_minutes_this_week,
        (
          SELECT coalesce(sum(amount), 0)::int
          FROM public.point_events
          WHERE user_id::text = ${userId}
            AND amount > 0
            AND event_type <> 'opening_balance'
            AND created_at >= date_trunc('week', now())
        ) AS weekly_points,
        (
          SELECT coalesce(round(avg(rating)::numeric, 1), 0)
          FROM public.reviews
          WHERE reviewee_id::text = ${userId}
        ) AS trust_score,
        (
          SELECT count(*)::int
          FROM public.reviews
          WHERE reviewee_id::text = ${userId}
        ) AS review_count;
    `,
    prisma.$queryRaw<WeeklyLearningRow[]>`
      WITH week_days AS (
        SELECT generate_series(
          date_trunc('week', now())::date,
          (date_trunc('week', now()) + interval '6 days')::date,
          interval '1 day'
        )::date AS activity_date
      ),
      activities AS (
        SELECT activity_date, sum(hours)::numeric AS hours
        FROM public.learning_activity
        WHERE user_id::text = ${userId}
          AND activity_date >= date_trunc('week', now())::date
          AND activity_date < (date_trunc('week', now()) + interval '7 days')::date
        GROUP BY activity_date
      ),
      completed_sessions AS (
        SELECT
          (scheduled_at AT TIME ZONE 'Europe/Istanbul')::date AS activity_date,
          sum(coalesce(duration_minutes, 60))::numeric / 60 AS hours
        FROM public.sessions
        WHERE (
            learner_id::text = ${userId}
            OR student_id::text = ${userId}
          )
          AND lower(coalesce(status, 'scheduled')) = 'completed'
          AND scheduled_at >= date_trunc('week', now())
          AND scheduled_at < date_trunc('week', now()) + interval '7 days'
        GROUP BY (scheduled_at AT TIME ZONE 'Europe/Istanbul')::date
      )
      SELECT
        week_days.activity_date,
        coalesce(activities.hours, 0) + coalesce(completed_sessions.hours, 0) AS hours
      FROM week_days
      LEFT JOIN activities USING (activity_date)
      LEFT JOIN completed_sessions USING (activity_date)
      ORDER BY week_days.activity_date;
    `,
    prisma.$queryRaw<UserSkillRow[]>`
      SELECT
        user_skills.id,
        coalesce(nullif(btrim(user_skills.name), ''), 'Beceri') AS name,
        coalesce(nullif(btrim(user_skills.kind), ''), 'teaches') AS kind,
        coalesce(user_skills.progress, 0)::int AS progress,
        coalesce(nullif(user_skills.color, ''), '#4338ca') AS color,
        count(sessions.id)::int AS completed_sessions,
        coalesce(sum(sessions.duration_minutes), 0)::numeric / 60 AS completed_hours
      FROM public.user_skills
      LEFT JOIN public.sessions
        ON lower(coalesce(sessions.status, 'scheduled')) = 'completed'
        AND lower(coalesce(sessions.skill_name, '')) =
          lower(coalesce(nullif(btrim(user_skills.name), ''), ''))
        AND (
          sessions.mentor_id = user_skills.user_id
          OR sessions.learner_id = user_skills.user_id
          OR sessions.student_id = user_skills.user_id
        )
      WHERE user_skills.user_id::text = ${userId}
      GROUP BY
        user_skills.id,
        user_skills.name,
        user_skills.kind,
        user_skills.progress,
        user_skills.color,
        user_skills.sort_order,
        user_skills.created_at
      ORDER BY user_skills.sort_order ASC, user_skills.created_at ASC
      LIMIT 4;
    `,
    prisma.$queryRaw<AchievementRow[]>`
      SELECT
        id,
        title,
        description,
        progress_current,
        progress_target,
        color
      FROM public.user_achievements
      WHERE user_id::text = ${userId}
        AND coalesce(is_active, true) = true
        AND achieved_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1;
    `,
    prisma.$queryRaw<SessionRow[]>`
      SELECT
        sessions.id,
        sessions.title,
        sessions.scheduled_at,
        sessions.meeting_link,
        sessions.skill_name,
        sessions.color,
        sessions.emoji,
        profiles.id AS peer_id,
        coalesce(
          nullif(btrim(profiles.full_name), ''),
          nullif(btrim(concat_ws(' ', profiles.first_name, profiles.last_name)), ''),
          'SkillBridge Kullanıcısı'
        ) AS peer_name,
        profiles.avatar_url AS peer_avatar_url
      FROM public.sessions
      LEFT JOIN public.profiles
        ON profiles.id = CASE
          WHEN sessions.mentor_id::text = ${userId}
            THEN coalesce(sessions.learner_id, sessions.student_id)
          ELSE sessions.mentor_id
        END
      WHERE (
          sessions.mentor_id::text = ${userId}
          OR sessions.learner_id::text = ${userId}
          OR sessions.student_id::text = ${userId}
        )
        AND sessions.scheduled_at >= now()
        AND lower(coalesce(sessions.status, 'scheduled')) = 'scheduled'
      ORDER BY sessions.scheduled_at ASC
      LIMIT 5;
    `,
    prisma.$queryRaw<MatchRow[]>`
      WITH active_matches AS (
        SELECT
          matches.id,
          CASE
            WHEN matches.user_id::text = ${userId}
              THEN matches.matched_user_id
            ELSE matches.user_id
          END AS other_user_id,
          coalesce(
            nullif(matches.skill_name, ''),
            nullif(matches.matched_skill_name, ''),
            'Beceri paylaşımı'
          ) AS skill_name,
          matches.distance_km,
          matches.created_at
        FROM public.matches
        WHERE (
            matches.user_id::text = ${userId}
            OR matches.matched_user_id::text = ${userId}
          )
          AND lower(coalesce(matches.status, 'recommended'))
            NOT IN ('rejected', 'declined', 'cancelled')
      )
      SELECT
        active_matches.id,
        active_matches.other_user_id,
        coalesce(
          nullif(btrim(profiles.full_name), ''),
          nullif(btrim(concat_ws(' ', profiles.first_name, profiles.last_name)), ''),
          'SkillBridge Kullanıcısı'
        ) AS other_name,
        profiles.avatar_url AS other_avatar_url,
        active_matches.skill_name,
        active_matches.distance_km,
        coalesce(round(avg(reviews.rating)::numeric, 1), 0) AS rating,
        count(reviews.id)::int AS review_count
      FROM active_matches
      JOIN public.profiles ON profiles.id = active_matches.other_user_id
      LEFT JOIN public.reviews ON reviews.reviewee_id = active_matches.other_user_id
      GROUP BY
        active_matches.id,
        active_matches.other_user_id,
        active_matches.skill_name,
        active_matches.distance_km,
        active_matches.created_at,
        profiles.full_name,
        profiles.first_name,
        profiles.last_name,
        profiles.avatar_url
      ORDER BY active_matches.created_at DESC NULLS LAST
      LIMIT 5;
    `,
    prisma.$queryRaw<LeaderboardRow[]>`
      WITH ranked_profiles AS (
        SELECT
          id,
          full_name,
          first_name,
          last_name,
          avatar_url,
          coalesce(skill_points, 0)::int AS skill_points,
          dense_rank() OVER (
            ORDER BY coalesce(skill_points, 0) DESC, created_at ASC
          )::int AS rank
        FROM public.profiles
        WHERE coalesce(profile_public, true) = true
      )
      SELECT *
      FROM ranked_profiles
      WHERE rank <= 5 OR id::text = ${userId}
      ORDER BY rank ASC, id ASC;
    `,
    prisma.$queryRaw<SidebarRow[]>`
      WITH active_peers AS (
        SELECT DISTINCT
          CASE
            WHEN user_id::text = ${userId} THEN matched_user_id
            ELSE user_id
          END AS peer_id
        FROM public.matches
        WHERE (
            user_id::text = ${userId}
            OR matched_user_id::text = ${userId}
          )
          AND lower(coalesce(status, 'recommended'))
            NOT IN ('rejected', 'declined', 'cancelled')
      )
      SELECT
        (SELECT count(*)::int FROM active_peers) AS match_count,
        (
          SELECT count(*)::int
          FROM public.messages
          WHERE receiver_id::text = ${userId}
            AND coalesce(is_read, false) = false
            AND sender_id IN (SELECT peer_id FROM active_peers)
        ) AS message_count,
        (
          SELECT count(*)::int
          FROM public.sessions
          WHERE (
              learner_id::text = ${userId}
              OR student_id::text = ${userId}
            )
            AND mentor_id::text <> ${userId}
            AND lower(coalesce(status, 'pending')) = 'pending'
        ) AS session_count,
        (
          SELECT count(*)::int
          FROM public.notifications
          WHERE user_id::text = ${userId}
            AND coalesce(is_read, false) = false
            AND dismissed_at IS NULL
        ) AS notification_count;
    `,
    prisma.$queryRaw<StreakRow[]>`
      WITH activity_dates AS (
        SELECT activity_date
        FROM public.learning_activity
        WHERE user_id::text = ${userId}
        UNION
        SELECT (scheduled_at AT TIME ZONE 'Europe/Istanbul')::date
        FROM public.sessions
        WHERE (
            mentor_id::text = ${userId}
            OR learner_id::text = ${userId}
            OR student_id::text = ${userId}
          )
          AND lower(coalesce(status, 'scheduled')) = 'completed'
      ),
      ordered_dates AS (
        SELECT DISTINCT activity_date
        FROM activity_dates
        WHERE activity_date <= (now() AT TIME ZONE 'Europe/Istanbul')::date
      ),
      anchors AS (
        SELECT
          activity_date,
          activity_date
            + row_number() OVER (ORDER BY activity_date DESC)::int AS anchor
        FROM ordered_dates
      ),
      current_group AS (
        SELECT count(*)::int AS streak_days
        FROM anchors
        WHERE anchor = (
          SELECT anchor
          FROM anchors
          WHERE activity_date >=
            (now() AT TIME ZONE 'Europe/Istanbul')::date - 1
          ORDER BY activity_date DESC
          LIMIT 1
        )
      )
      SELECT coalesce(streak_days, 0)::int AS streak_days
      FROM current_group;
    `,
  ]);

  const profile = profiles[0] ?? null;
  const summary = summaries[0];
  const sidebarCounts = sidebar[0];
  const skillPoints = toNumber(profile?.skill_points);
  const coinBalance = toNumber(profile?.coin_balance);
  const level = calculateLevelProgress(skillPoints);
  const fullName = getName(profile);
  const firstName =
    profile?.first_name?.trim() || fullName.split(" ")[0] || "Öğrenci";
  const schoolInfo =
    [profile?.university, profile?.department].filter(Boolean).join(" · ") ||
    "Üniversite Öğrencisi";
  const weeklyPoints = summary?.weekly_points ?? 0;
  const teachingMinutes = summary?.teaching_minutes ?? 0;
  const teachingMinutesThisWeek = summary?.teaching_minutes_this_week ?? 0;

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: userId,
      firstName,
      fullName,
      schoolInfo,
      avatarUrl: profile?.avatar_url ?? null,
      skillPoints,
      coinBalance,
      trustScore: toNumber(summary?.trust_score),
      reviewCount: summary?.review_count ?? 0,
      streakDays: streak[0]?.streak_days ?? 0,
      nextLevelPoints: level.nextLevelPoints,
      pointsToNextLevel: level.pointsToNextLevel,
    },
    stats: {
      sessions: {
        value: String(summary?.completed_sessions ?? 0),
        trend: `Bu hafta +${summary?.completed_this_week ?? 0}`,
      },
      teachingHours: {
        value: `${formatHours(teachingMinutes)}s`,
        trend: `Bu hafta +${formatHours(teachingMinutesThisWeek)}s`,
      },
      skillPoints: {
        value: skillPoints.toLocaleString("tr-TR"),
        trend: `Bu hafta ${weeklyPoints >= 0 ? "+" : ""}${weeklyPoints}`,
      },
      trustScore: {
        value: toNumber(summary?.trust_score).toFixed(1),
        trend:
          (summary?.review_count ?? 0) > 0
            ? `${summary.review_count} değerlendirme`
            : "Henüz değerlendirme yok",
      },
    },
    weeklyLearning: {
      totalHours: Number(
        weeklyLearning
          .reduce((total, row) => total + toNumber(row.hours), 0)
          .toFixed(1),
      ),
      data: weeklyLearning.map((row, index) => ({
        day: WEEKDAY_LABELS[index] ?? "",
        hours: Number(toNumber(row.hours).toFixed(1)),
      })),
    },
    activeSkills: userSkills.map((skill, index) => ({
      id: skill.id,
      name: skill.name,
      kind: skill.kind,
      progress: Math.min(100, Math.max(0, skill.progress)),
      sessionsCompleted: skill.completed_sessions,
      hours: Number(toNumber(skill.completed_hours).toFixed(1)),
      fill: skill.color || SKILL_COLORS[index % SKILL_COLORS.length],
    })),
    nextAchievement: achievements[0]
      ? {
          id: achievements[0].id,
          title: achievements[0].title,
          description: achievements[0].description,
          progressPercent: Math.min(
            100,
            Math.max(
              0,
              Math.round(
                (achievements[0].progress_current /
                  Math.max(1, achievements[0].progress_target)) *
                  100,
              ),
            ),
          ),
          color: achievements[0].color,
        }
      : null,
    recentMatches: recentMatches.map((match) => ({
      id: match.id,
      otherUserId: match.other_user_id,
      name: match.other_name || "SkillBridge Kullanıcısı",
      skill: match.skill_name || "Beceri paylaşımı",
      avatar: match.other_avatar_url,
      rating: toNumber(match.rating),
      reviewCount: match.review_count,
      distance: match.distance_km ? `${match.distance_km} km` : "-",
      online: false,
    })),
    upcomingSessions: upcomingSessions.map((session) => ({
      id: session.id,
      title: session.title || session.skill_name || "Görüşme",
      peerId: session.peer_id,
      peerName: session.peer_name || "SkillBridge Kullanıcısı",
      peerAvatarUrl: session.peer_avatar_url,
      scheduledAt: session.scheduled_at,
      color: session.color || "#4338ca",
      emoji: session.emoji || "book",
      meetingLink: session.meeting_link,
    })),
    leaderboard: leaderboard.map((row) => ({
      id: row.id,
      rank: row.rank,
      name: getName(row),
      points: row.skill_points,
      avatar: row.avatar_url,
      badge: row.rank === 1 ? "1" : "",
      isMe: row.id === userId,
    })),
    sidebar: {
      matchCount: sidebarCounts?.match_count ?? 0,
      messageCount: sidebarCounts?.message_count ?? 0,
      sessionCount: sidebarCounts?.session_count ?? 0,
      notificationCount: sidebarCounts?.notification_count ?? 0,
      skillPoints,
      coinBalance,
      nextLevelPoints: level.nextLevelPoints,
      pointsToNextLevel: level.pointsToNextLevel,
      skillPointProgress: level.progress,
    },
  };
}

export async function searchDashboard(userId: string, query: string) {
  const prisma = getPrismaClient();
  const pattern = `%${query.trim()}%`;

  const [profiles, skills] = await Promise.all([
    prisma.$queryRaw<SearchProfileRow[]>`
      SELECT
        profiles.id,
        profiles.full_name,
        profiles.first_name,
        profiles.last_name,
        profiles.university,
        profiles.department,
        profiles.avatar_url,
        EXISTS (
          SELECT 1
          FROM public.matches
          WHERE (
              (
                user_id::text = ${userId}
                AND matched_user_id = profiles.id
              )
              OR (
                matched_user_id::text = ${userId}
                AND user_id = profiles.id
              )
            )
            AND lower(coalesce(status, 'recommended'))
              NOT IN ('rejected', 'declined', 'cancelled')
        ) AS matched
      FROM public.profiles
      WHERE profiles.id::text <> ${userId}
        AND coalesce(profiles.profile_public, true) = true
        AND (
          profiles.full_name ILIKE ${pattern}
          OR profiles.first_name ILIKE ${pattern}
          OR profiles.last_name ILIKE ${pattern}
          OR profiles.university ILIKE ${pattern}
          OR profiles.department ILIKE ${pattern}
          OR EXISTS (
            SELECT 1
            FROM unnest(coalesce(profiles.teaches, ARRAY[]::text[])) AS skill
            WHERE skill ILIKE ${pattern}
          )
          OR EXISTS (
            SELECT 1
            FROM unnest(coalesce(profiles.learns, ARRAY[]::text[])) AS skill
            WHERE skill ILIKE ${pattern}
          )
        )
      ORDER BY matched DESC, profiles.full_name ASC
      LIMIT 6;
    `,
    prisma.$queryRaw<SearchSkillRow[]>`
      WITH skill_names AS (
        SELECT unnest(coalesce(teaches, ARRAY[]::text[])) AS name
        FROM public.profiles
        WHERE coalesce(profile_public, true) = true
        UNION ALL
        SELECT unnest(coalesce(learns, ARRAY[]::text[])) AS name
        FROM public.profiles
        WHERE coalesce(profile_public, true) = true
        UNION ALL
        SELECT name
        FROM public.user_skills
        WHERE nullif(btrim(name), '') IS NOT NULL
      )
      SELECT btrim(name) AS name, count(*)::int AS member_count
      FROM skill_names
      WHERE name ILIKE ${pattern}
      GROUP BY btrim(name)
      ORDER BY member_count DESC, btrim(name) ASC
      LIMIT 4;
    `,
  ]);

  return [
    ...profiles.map((profile) => ({
      id: profile.id,
      type: "profile" as const,
      title: getName(profile),
      subtitle:
        [profile.university, profile.department].filter(Boolean).join(" · ") ||
        "SkillBridge kullanıcısı",
      avatarUrl: profile.avatar_url,
      matched: profile.matched,
      action: profile.matched ? ("messages" as const) : ("findmatch" as const),
    })),
    ...skills.map((skill) => ({
      id: `skill-${skill.name.toLocaleLowerCase("tr-TR")}`,
      type: "skill" as const,
      title: skill.name,
      subtitle: `${skill.member_count} profilde bulunuyor`,
      avatarUrl: null,
      matched: false,
      action: "findmatch" as const,
    })),
  ].slice(0, 8);
}
