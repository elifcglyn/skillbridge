import { getPrismaClient } from "../lib/prisma.js";

type SummaryRow = {
  skill_points: number;
  completed_sessions: number;
  session_hours: unknown;
  activity_hours: unknown;
};

type SkillRow = {
  id: string;
  name: string;
  kind: string;
  progress: number;
  color: string;
  completed_sessions: number;
  hours: unknown;
};

type WeeklyRow = {
  day_index: number;
  skill_name: string;
  hours: unknown;
};

type MonthlyRow = {
  month_number: number;
  hours: unknown;
};

type StreakRow = {
  streak_days: number;
};

type AchievementRow = {
  id: string;
  title: string;
  description: string;
  progress_current: number;
  progress_target: number;
  color: string;
};

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_LABELS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];
const FALLBACK_COLORS = ["#4338ca", "#06b6d4", "#7c3aed", "#10b981"];
const LEVELS = ["Başlangıç", "Orta", "İleri", "Uzman"] as const;

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function skillLevel(progress: number) {
  if (progress < 25) {
    return {
      level: LEVELS[0],
      nextLevel: LEVELS[1],
      pointsToNext: (25 - progress) * 10,
    };
  }
  if (progress < 50) {
    return {
      level: LEVELS[1],
      nextLevel: LEVELS[2],
      pointsToNext: (50 - progress) * 10,
    };
  }
  if (progress < 75) {
    return {
      level: LEVELS[2],
      nextLevel: LEVELS[3],
      pointsToNext: (75 - progress) * 10,
    };
  }
  return {
    level: LEVELS[3],
    nextLevel: null,
    pointsToNext: 0,
  };
}

function skillEmoji(name: string) {
  const normalized = name.toLocaleLowerCase("tr-TR");
  if (normalized.includes("python")) return "🐍";
  if (normalized.includes("react")) return "⚛️";
  if (normalized.includes("tasarım") || normalized.includes("design")) return "🎨";
  if (normalized.includes("ingiliz") || normalized.includes("english")) return "🇬🇧";
  if (normalized.includes("ispanyol") || normalized.includes("spanish")) return "🇪🇸";
  return "📚";
}

export async function getProgress(userId: string, year: number) {
  const prisma = getPrismaClient();
  const [
    summaries,
    skills,
    weeklyRows,
    monthlyRows,
    streakRows,
    achievements,
  ] = await Promise.all([
    prisma.$queryRaw<SummaryRow[]>`
      SELECT
        coalesce(profiles.skill_points, 0)::int AS skill_points,
        (
          SELECT count(*)::int
          FROM public.sessions
          WHERE (
              learner_id::text = ${userId}
              OR student_id::text = ${userId}
            )
            AND lower(coalesce(status, 'scheduled')) = 'completed'
        ) AS completed_sessions,
        (
          SELECT coalesce(sum(duration_minutes), 0)::numeric / 60
          FROM public.sessions
          WHERE (
              learner_id::text = ${userId}
              OR student_id::text = ${userId}
            )
            AND lower(coalesce(status, 'scheduled')) = 'completed'
        ) AS session_hours,
        (
          SELECT coalesce(sum(hours), 0)
          FROM public.learning_activity
          WHERE user_id::text = ${userId}
        ) AS activity_hours
      FROM public.profiles
      WHERE profiles.id::text = ${userId}
      LIMIT 1;
    `,
    prisma.$queryRaw<SkillRow[]>`
      SELECT
        user_skills.id,
        coalesce(nullif(btrim(user_skills.name), ''), 'Beceri') AS name,
        coalesce(nullif(btrim(user_skills.kind), ''), 'teaches') AS kind,
        greatest(0, least(100, coalesce(user_skills.progress, 0)))::int AS progress,
        coalesce(nullif(user_skills.color, ''), '#4338ca') AS color,
        count(sessions.id)::int AS completed_sessions,
        coalesce(sum(sessions.duration_minutes), 0)::numeric / 60 AS hours
      FROM public.user_skills
      LEFT JOIN public.sessions
        ON lower(coalesce(sessions.status, 'scheduled')) = 'completed'
        AND lower(coalesce(sessions.skill_name, '')) =
          lower(coalesce(nullif(btrim(user_skills.name), ''), ''))
        AND (
          sessions.learner_id = user_skills.user_id
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
      ORDER BY user_skills.sort_order ASC, user_skills.created_at ASC;
    `,
    prisma.$queryRaw<WeeklyRow[]>`
      SELECT
        extract(
          isodow FROM scheduled_at AT TIME ZONE 'Europe/Istanbul'
        )::int AS day_index,
        coalesce(nullif(btrim(skill_name), ''), 'Diğer') AS skill_name,
        sum(coalesce(duration_minutes, 60))::numeric / 60 AS hours
      FROM public.sessions
      WHERE (
          learner_id::text = ${userId}
          OR student_id::text = ${userId}
        )
        AND lower(coalesce(status, 'scheduled')) = 'completed'
        AND scheduled_at >= date_trunc('week', now())
        AND scheduled_at < date_trunc('week', now()) + interval '7 days'
      GROUP BY
        extract(
          isodow FROM scheduled_at AT TIME ZONE 'Europe/Istanbul'
        ),
        coalesce(nullif(btrim(skill_name), ''), 'Diğer')
      ORDER BY day_index ASC;
    `,
    prisma.$queryRaw<MonthlyRow[]>`
      WITH months AS (
        SELECT generate_series(1, 12)::int AS month_number
      ),
      activities AS (
        SELECT
          extract(month FROM activity_date)::int AS month_number,
          sum(hours)::numeric AS hours
        FROM public.learning_activity
        WHERE user_id::text = ${userId}
          AND extract(year FROM activity_date)::int = ${year}
        GROUP BY extract(month FROM activity_date)
      ),
      sessions AS (
        SELECT
          extract(
            month FROM scheduled_at AT TIME ZONE 'Europe/Istanbul'
          )::int AS month_number,
          sum(coalesce(duration_minutes, 60))::numeric / 60 AS hours
        FROM public.sessions
        WHERE (
            learner_id::text = ${userId}
            OR student_id::text = ${userId}
          )
          AND lower(coalesce(status, 'scheduled')) = 'completed'
          AND extract(
            year FROM scheduled_at AT TIME ZONE 'Europe/Istanbul'
          )::int = ${year}
        GROUP BY extract(
          month FROM scheduled_at AT TIME ZONE 'Europe/Istanbul'
        )
      )
      SELECT
        months.month_number,
        coalesce(activities.hours, 0) + coalesce(sessions.hours, 0) AS hours
      FROM months
      LEFT JOIN activities USING (month_number)
      LEFT JOIN sessions USING (month_number)
      ORDER BY months.month_number;
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
            learner_id::text = ${userId}
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
      )
      SELECT coalesce(count(*), 0)::int AS streak_days
      FROM anchors
      WHERE anchor = (
        SELECT anchor
        FROM anchors
        WHERE activity_date >=
          (now() AT TIME ZONE 'Europe/Istanbul')::date - 1
        ORDER BY activity_date DESC
        LIMIT 1
      );
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
  ]);

  const summary = summaries[0];
  const totalHours = toNumber(summary?.session_hours) +
    toNumber(summary?.activity_hours);
  const skillColorMap = new Map(
    skills.map((skill, index) => [
      skill.name.toLocaleLowerCase("tr-TR"),
      skill.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    ]),
  );
  const weeklySkillNames = Array.from(
    new Set(weeklyRows.map((row) => row.skill_name)),
  ).slice(0, 5);
  const weeklySeries = weeklySkillNames.map((name, index) => ({
    key: `skill${index}`,
    name,
    color:
      skillColorMap.get(name.toLocaleLowerCase("tr-TR")) ||
      FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));
  const weeklyData = WEEKDAY_LABELS.map((day, index) => {
    const entry: Record<string, string | number> = { day };

    weeklySeries.forEach((series) => {
      const matching = weeklyRows.find(
        (row) =>
          row.day_index === index + 1 &&
          row.skill_name === series.name,
      );
      entry[series.key] = Number(toNumber(matching?.hours).toFixed(1));
    });
    return entry;
  });
  const monthlyData = monthlyRows.map((row) => ({
    month: MONTH_LABELS[row.month_number - 1] ?? "",
    hours: Number(toNumber(row.hours).toFixed(1)),
  }));

  return {
    generatedAt: new Date().toISOString(),
    year,
    summary: {
      totalHours: Number(totalHours.toFixed(1)),
      currentStreak: streakRows[0]?.streak_days ?? 0,
      completedSessions: summary?.completed_sessions ?? 0,
      skillPoints: summary?.skill_points ?? 0,
    },
    skills: skills.map((skill, index) => {
      const progress = Math.min(100, Math.max(0, skill.progress));
      const level = skillLevel(progress);
      return {
        id: skill.id,
        name: skill.name,
        kind: skill.kind,
        progress,
        color:
          skill.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        emoji: skillEmoji(skill.name),
        completedSessions: skill.completed_sessions,
        hours: Number(toNumber(skill.hours).toFixed(1)),
        level: level.level,
        nextLevel: level.nextLevel,
        pointsToNext: level.pointsToNext,
      };
    }),
    weeklyLearning: {
      series: weeklySeries,
      data: weeklyData,
    },
    radar: skills.slice(0, 6).map((skill) => ({
      skill: skill.name,
      value: Math.min(100, Math.max(0, skill.progress)),
    })),
    monthlyLearning: {
      totalHours: Number(
        monthlyData.reduce((total, item) => total + item.hours, 0).toFixed(1),
      ),
      data: monthlyData,
    },
    activeAchievement: achievements[0]
      ? {
          id: achievements[0].id,
          title: achievements[0].title,
          description: achievements[0].description,
          progressCurrent: achievements[0].progress_current,
          progressTarget: achievements[0].progress_target,
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
  };
}
