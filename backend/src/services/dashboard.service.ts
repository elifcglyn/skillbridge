import { getPrismaClient } from "../lib/prisma.js";

type CountRow = { count: number };

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
};

type SessionRow = {
  id: string;
  title: string | null;
  mentor_id: string | null;
  learner_id: string | null;
  student_id: string | null;
  scheduled_at: Date;
  duration_minutes: number | null;
  delivery_type: string | null;
  status: string | null;
  meeting_link: string | null;
  skill_name: string | null;
  color: string | null;
  emoji: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
};

type MatchRow = {
  id: string;
  other_user_id: string | null;
  other_name: string | null;
  other_avatar_url: string | null;
  skill_name: string | null;
  matched_skill_name: string | null;
  match_score: number | null;
  distance_km: unknown;
  status: string | null;
};

function getName(row?: { full_name?: string | null; first_name?: string | null; last_name?: string | null } | null) {
  const explicitName = row?.full_name?.trim();
  if (explicitName) return explicitName;

  const composedName = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return composedName || "SkillBridge Kullanıcısı";
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getDashboard(userId: string) {
  const prisma = getPrismaClient();

  const [
    profiles,
    sessionCounts,
    pendingConnections,
    unreadMessages,
    unreadNotifications,
    upcomingSessions,
    recentMatches,
    leaderboard,
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
        skill_points
      FROM public.profiles
      WHERE id::text = ${userId}
      LIMIT 1;
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT count(*)::int AS count
      FROM public.sessions
      WHERE (
          mentor_id::text = ${userId}
          OR learner_id::text = ${userId}
          OR student_id::text = ${userId}
        )
        AND lower(coalesce(status, 'scheduled')) = 'completed';
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT count(*)::int AS count
      FROM public.connections
      WHERE receiver_id::text = ${userId}
        AND lower(coalesce(status, 'pending')) = 'pending';
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT count(*)::int AS count
      FROM public.messages
      WHERE receiver_id::text = ${userId}
        AND coalesce(is_read, false) = false;
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT count(*)::int AS count
      FROM public.notifications
      WHERE user_id::text = ${userId}
        AND coalesce(is_read, false) = false
        AND dismissed_at IS NULL;
    `,
    prisma.$queryRaw<SessionRow[]>`
      SELECT
        sessions.id,
        sessions.title,
        sessions.mentor_id,
        sessions.learner_id,
        sessions.student_id,
        sessions.scheduled_at,
        sessions.duration_minutes,
        sessions.delivery_type,
        sessions.status,
        sessions.meeting_link,
        sessions.skill_name,
        sessions.color,
        sessions.emoji,
        profiles.full_name AS peer_name,
        profiles.avatar_url AS peer_avatar_url
      FROM public.sessions
      LEFT JOIN public.profiles
        ON profiles.id = CASE
          WHEN sessions.mentor_id::text = ${userId} THEN coalesce(sessions.learner_id, sessions.student_id)
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
      SELECT
        matches.id,
        CASE
          WHEN matches.user_id::text = ${userId} THEN matches.matched_user_id
          ELSE matches.user_id
        END AS other_user_id,
        profiles.full_name AS other_name,
        profiles.avatar_url AS other_avatar_url,
        matches.skill_name,
        matches.matched_skill_name,
        matches.match_score,
        matches.distance_km,
        matches.status
      FROM public.matches
      LEFT JOIN public.profiles
        ON profiles.id = CASE
          WHEN matches.user_id::text = ${userId} THEN matches.matched_user_id
          ELSE matches.user_id
        END
      WHERE matches.user_id::text = ${userId}
         OR matches.matched_user_id::text = ${userId}
      ORDER BY matches.created_at DESC NULLS LAST
      LIMIT 5;
    `,
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
        skill_points
      FROM public.profiles
      WHERE coalesce(profile_public, true) = true
      ORDER BY coalesce(skill_points, 0) DESC, created_at DESC
      LIMIT 5;
    `,
  ]);

  const profile = profiles[0] ?? null;
  const skillPoints = toNumber(profile?.skill_points);
  const fullName = getName(profile);
  const firstName = profile?.first_name?.trim() || fullName.split(" ")[0] || "Öğrenci";
  const schoolInfo = [profile?.university, profile?.department].filter(Boolean).join(" · ") || "Üniversite Öğrencisi";

  return {
    user: {
      id: userId,
      firstName,
      fullName,
      schoolInfo,
      avatarUrl: profile?.avatar_url ?? null,
      skillPoints,
      trustScore: 0,
      streakDays: 0,
      nextLevelPoints: Math.max(0, 3000 - skillPoints),
    },
    stats: {
      sessions: { value: String(sessionCounts[0]?.count ?? 0), trend: "Tamamlanan" },
      teachingHours: { value: "0s", trend: "API hazır" },
      skillPoints: { value: skillPoints.toLocaleString("en-US"), trend: "Profil puanı" },
      trustScore: { value: "0", trend: "Geri bildirim bekliyor" },
    },
    weeklyLearning: {
      totalHours: 0,
      data: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => ({ day, hours: 0 })),
    },
    activeSkills: [...(profile?.teaches ?? []), ...(profile?.learns ?? [])]
      .slice(0, 4)
      .map((skill, index) => ({
        id: `${skill}-${index}`,
        name: skill,
        progress: 0,
        fill: ["#4338ca", "#06b6d4", "#7c3aed", "#10b981"][index % 4],
      })),
    nextAchievement: null,
    recentMatches: recentMatches.map((match) => ({
      id: match.id,
      name: match.other_name || "SkillBridge Kullanıcısı",
      skill: match.skill_name || match.matched_skill_name || "Beceri paylaşımı",
      avatar: match.other_avatar_url,
      rating: Math.round((toNumber(match.match_score) / 20) * 10) / 10,
      distance: match.distance_km ? `${match.distance_km}km` : "-",
      online: false,
    })),
    upcomingSessions: upcomingSessions.map((session) => ({
      id: session.id,
      title: session.title || session.skill_name || "Görüşme",
      mentor: session.peer_name || "SkillBridge Kullanıcısı",
      time: formatDateTime(session.scheduled_at),
      color: session.color || "#4338ca",
      emoji: session.emoji || "book",
      meetingLink: session.meeting_link,
    })),
    leaderboard: leaderboard.map((row, index) => ({
      id: row.id,
      rank: index + 1,
      name: getName(row),
      points: toNumber(row.skill_points),
      avatar: row.avatar_url,
      badge: index === 0 ? "1" : "",
      isMe: row.id === userId,
    })),
    sidebar: {
      matchCount: pendingConnections[0]?.count ?? 0,
      messageCount: unreadMessages[0]?.count ?? 0,
      notificationCount: unreadNotifications[0]?.count ?? 0,
      skillPoints,
      nextLevelPoints: Math.max(0, 3000 - skillPoints),
      skillPointProgress: Math.min(100, Math.round((skillPoints / 3000) * 100)),
    },
  };
}
