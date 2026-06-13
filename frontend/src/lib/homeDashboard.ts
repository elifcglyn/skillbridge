import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const WEEK_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DEFAULT_SKILL_COLORS = ["#4338ca", "#06b6d4", "#7c3aed", "#10b981"];

type SkillKind = "teaches" | "learns" | "active";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  university: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
  role: string | null;
  avatar_url: string | null;
  profile_public: boolean | null;
  show_online: boolean | null;
  is_online: boolean | null;
  skill_points: number | null;
  trust_score: number | null;
  streak_days: number | null;
  next_level_points: number | null;
}

interface UserSkillRow {
  id: string;
  user_id: string;
  name: string;
  kind: SkillKind;
  progress: number | null;
  color: string | null;
  sort_order: number | null;
}

interface MatchRow {
  id: string;
  user_id: string;
  matched_user_id: string;
  skill_name: string | null;
  matched_skill_name: string | null;
  status: string;
  match_score: number | null;
  distance_km: number | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  title: string;
  skill_name: string | null;
  mentor_id: string;
  learner_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  delivery_type: string | null;
  status: string;
  color: string | null;
  emoji: string | null;
}

interface LearningActivityRow {
  activity_date: string;
  hours: number | null;
}

interface PointEventRow {
  points: number | null;
  occurred_at: string;
}

interface ReviewRow {
  rating: number | null;
}

interface AchievementRow {
  id: string;
  title: string;
  description: string | null;
  progress_current: number | null;
  progress_target: number | null;
  color: string | null;
}

export interface HomeDashboardData {
  user: {
    id: string;
    firstName: string;
    fullName: string;
    schoolInfo: string;
    avatarUrl: string | null;
    skillPoints: number;
    trustScore: number;
    streakDays: number;
    nextLevelPoints: number;
  };
  stats: {
    sessions: { value: string; trend: string };
    teachingHours: { value: string; trend: string };
    skillPoints: { value: string; trend: string };
    trustScore: { value: string; trend: string };
  };
  weeklyLearning: {
    totalHours: number;
    data: { day: string; hours: number }[];
  };
  activeSkills: { id: string; name: string; progress: number; fill: string }[];
  nextAchievement: {
    title: string;
    description: string;
    progressPercent: number;
    color: string;
  } | null;
  recentMatches: {
    id: string;
    name: string;
    skill: string;
    avatar: string | null;
    rating: number;
    distance: string;
    online: boolean;
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    mentor: string;
    time: string;
    color: string;
    emoji: string;
  }[];
  leaderboard: {
    id: string;
    rank: number;
    name: string;
    points: number;
    avatar: string | null;
    badge: string;
    isMe: boolean;
  }[];
  sidebar: {
    matchCount: number;
    messageCount: number;
    skillPoints: number;
    nextLevelPoints: number;
    skillPointProgress: number;
  };
}

export interface HomeSearchResult {
  id: string;
  type: "profile" | "skill";
  title: string;
  subtitle: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Ana sayfa verileri yüklenirken bir hata oluştu.";
}

function getMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value : "";
}

function getMetadataStringArray(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function formatProfileName(profile?: Partial<ProfileRow> | null) {
  if (!profile) return "SkillBridge Kullanıcısı";
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || "SkillBridge Kullanıcısı";
}

function getFirstName(profile: ProfileRow, user: User) {
  return profile.first_name?.trim() || getMetadataString(user, "first_name") || "Öğrenci";
}

function getSchoolInfo(profile: ProfileRow) {
  const university = profile.university?.trim();
  const department = profile.department?.trim();
  if (!university) return "Üniversite Öğrencisi";
  return department ? `${university} · ${department}` : university;
}

function numberFormat(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatHours(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}s`;
}

function formatTrustScore(value: number) {
  return value > 0 ? value.toFixed(1) : "0";
}

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const mondayOffset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - mondayOffset);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date = new Date()) {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameLocalDay(left: Date, right: Date) {
  return toDateKey(left) === toDateKey(right);
}

function formatDashboardDateTime(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (sameLocalDay(date, now)) return `Bugün, ${time}`;
  if (sameLocalDay(date, tomorrow)) return `Yarın, ${time}`;

  const day = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(date);

  return `${day}, ${time}`;
}

function emptyWeeklyLearning() {
  return WEEK_DAYS.map((day) => ({ day, hours: 0 }));
}

function normalizeHours(value: number | null | undefined) {
  return Math.round(Number(value ?? 0) * 10) / 10;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getPeerId(match: MatchRow, userId: string) {
  return match.user_id === userId ? match.matched_user_id : match.user_id;
}

function getSessionPeerId(session: SessionRow, userId: string) {
  return session.mentor_id === userId ? session.learner_id : session.mentor_id;
}

function getRankBadge(rank: number) {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

async function fetchOrCreateProfile(user: User) {
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingProfile) return existingProfile as ProfileRow;

  const profileFromMetadata = {
    id: user.id,
    first_name: getMetadataString(user, "first_name"),
    last_name: getMetadataString(user, "last_name"),
    university: getMetadataString(user, "university"),
    department: getMetadataString(user, "department"),
    location: getMetadataString(user, "location"),
    bio: getMetadataString(user, "bio"),
    role: getMetadataString(user, "role") || "both",
  };

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .upsert(profileFromMetadata, { onConflict: "id" })
    .select("*")
    .single();

  if (createError) throw createError;
  return createdProfile as ProfileRow;
}

async function fetchUserSkills(user: User) {
  const { data, error } = await supabase
    .from("user_skills")
    .select("id,user_id,name,kind,progress,color,sort_order")
    .eq("user_id", user.id)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  const skills = (data ?? []) as UserSkillRow[];
  if (skills.length > 0) return skills;

  const teachSkills = getMetadataStringArray(user, "teaches");
  const learnSkills = getMetadataStringArray(user, "learns");
  const rows = [
    ...teachSkills.map((name, index) => ({
      user_id: user.id,
      name,
      kind: "teaches" as const,
      sort_order: index,
      color: DEFAULT_SKILL_COLORS[index % DEFAULT_SKILL_COLORS.length],
    })),
    ...learnSkills.map((name, index) => ({
      user_id: user.id,
      name,
      kind: "learns" as const,
      sort_order: index,
      color: DEFAULT_SKILL_COLORS[index % DEFAULT_SKILL_COLORS.length],
    })),
  ];

  if (rows.length === 0) return [];

  const { data: seededSkills, error: seedError } = await supabase
    .from("user_skills")
    .insert(rows)
    .select("id,user_id,name,kind,progress,color,sort_order");

  if (seedError) throw seedError;
  return (seededSkills ?? []) as UserSkillRow[];
}

async function fetchProfilesById(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueIds.length === 0) return new Map<string, ProfileRow>();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,university,department,location,bio,role,avatar_url,profile_public,show_online,is_online,skill_points,trust_score,streak_days,next_level_points")
    .in("id", uniqueIds);

  if (error) throw error;
  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

async function getLeaderboard(profile: ProfileRow, user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,avatar_url,skill_points,profile_public")
    .order("skill_points", { ascending: false })
    .limit(50);

  if (error) throw error;

  const rows = ((data ?? []) as ProfileRow[]).filter((row) => row.profile_public || row.id === user.id);
  const existingCurrentProfile = rows.find((row) => row.id === user.id);

  if (!existingCurrentProfile) {
    rows.push(profile);
    rows.sort((left, right) => Number(right.skill_points ?? 0) - Number(left.skill_points ?? 0));
  }

  const ranked = rows.map((row, index) => ({
    row,
    rank: index + 1,
  }));

  const topFive = ranked.slice(0, 5);
  const currentRank = ranked.find((item) => item.row.id === user.id);
  const visibleRows = currentRank && !topFive.some((item) => item.row.id === user.id)
    ? [...topFive.slice(0, 4), currentRank]
    : topFive;

  return visibleRows.map(({ row, rank }) => ({
    id: row.id,
    rank,
    name: formatProfileName(row),
    points: Number(row.skill_points ?? 0),
    avatar: row.avatar_url ?? null,
    badge: getRankBadge(rank),
    isMe: row.id === user.id,
  }));
}

async function getRankPercent(skillPoints: number) {
  const [{ count: totalCount, error: totalError }, { count: higherCount, error: higherError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("profile_public", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("profile_public", true)
        .gt("skill_points", skillPoints),
    ]);

  if (totalError) throw totalError;
  if (higherError) throw higherError;

  const total = totalCount ?? 0;
  if (total === 0) return 0;

  const rank = (higherCount ?? 0) + 1;
  return Math.max(1, Math.round((rank / total) * 100));
}

function buildActiveSkills(skills: UserSkillRow[]) {
  const preferredSkills = skills.filter((skill) => skill.kind === "active");
  const fallbackSkills = preferredSkills.length > 0
    ? preferredSkills
    : skills.filter((skill) => skill.kind === "learns" || skill.kind === "teaches");

  return fallbackSkills.slice(0, 3).map((skill, index) => ({
    id: skill.id,
    name: skill.name,
    progress: clampPercent(Number(skill.progress ?? 0)),
    fill: skill.color || DEFAULT_SKILL_COLORS[index % DEFAULT_SKILL_COLORS.length],
  }));
}

function buildWeeklyLearning(activities: LearningActivityRow[]) {
  const weekly = emptyWeeklyLearning();
  const weekStart = startOfWeek();

  for (const activity of activities) {
    const activityDate = new Date(`${activity.activity_date}T00:00:00`);
    const dayIndex = Math.round((activityDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < weekly.length) {
      weekly[dayIndex].hours = normalizeHours(weekly[dayIndex].hours + Number(activity.hours ?? 0));
    }
  }

  const totalHours = normalizeHours(weekly.reduce((sum, item) => sum + item.hours, 0));
  return { totalHours, data: weekly };
}

function buildAchievement(achievement?: AchievementRow | null) {
  if (!achievement) return null;

  const target = Number(achievement.progress_target ?? 1);
  const current = Number(achievement.progress_current ?? 0);

  return {
    title: achievement.title,
    description: achievement.description || "Bir sonraki başarı hedefin için ilerlemeye devam et.",
    progressPercent: clampPercent((current / target) * 100),
    color: achievement.color || "#f59e0b",
  };
}

function buildRecentMatches(matches: MatchRow[], profiles: Map<string, ProfileRow>, userId: string) {
  return matches
    .filter((match) => !["declined", "rejected", "cancelled"].includes(match.status.toLowerCase()))
    .slice(0, 3)
    .map((match) => {
      const peerProfile = profiles.get(getPeerId(match, userId));
      const rating = Number(peerProfile?.trust_score ?? 0) > 0
        ? Math.round((Number(peerProfile?.trust_score ?? 0) / 2) * 10) / 10
        : 0;

      return {
        id: match.id,
        name: formatProfileName(peerProfile),
        skill: match.matched_skill_name || match.skill_name || "Beceri paylaşımı",
        avatar: peerProfile?.avatar_url ?? null,
        rating,
        distance: typeof match.distance_km === "number" ? `${match.distance_km.toFixed(1)}km` : "-",
        online: Boolean(peerProfile?.show_online && peerProfile?.is_online),
      };
    });
}

function buildUpcomingSessions(sessions: SessionRow[], profiles: Map<string, ProfileRow>, userId: string) {
  const now = Date.now();

  return sessions
    .filter((session) => session.status.toLowerCase() === "scheduled" && new Date(session.scheduled_at).getTime() >= now)
    .slice(0, 3)
    .map((session) => {
      const peerProfile = profiles.get(getSessionPeerId(session, userId));

      return {
        id: session.id,
        title: session.title,
        mentor: formatProfileName(peerProfile),
        time: formatDashboardDateTime(session.scheduled_at),
        color: session.color || "#4338ca",
        emoji: session.emoji || "📚",
      };
    });
}

function buildStats(params: {
  sessions: SessionRow[];
  points: PointEventRow[];
  reviews: ReviewRow[];
  profile: ProfileRow;
  rankPercent: number;
}) {
  const now = new Date();
  const weekStart = startOfWeek(now).getTime();
  const weekEnd = endOfWeek(now).getTime();
  const completedSessions = params.sessions.filter((session) => session.status.toLowerCase() === "completed");
  const completedThisWeek = completedSessions.filter((session) => {
    const scheduledAt = new Date(session.scheduled_at).getTime();
    return scheduledAt >= weekStart && scheduledAt <= weekEnd;
  });
  const teachingSessions = completedSessions.filter((session) => session.mentor_id === params.profile.id);
  const teachingHours = teachingSessions.reduce(
    (sum, session) => sum + Number(session.duration_minutes ?? 0) / 60,
    0,
  );
  const teachingHoursToday = teachingSessions
    .filter((session) => sameLocalDay(new Date(session.scheduled_at), now))
    .reduce((sum, session) => sum + Number(session.duration_minutes ?? 0) / 60, 0);
  const pointsToday = params.points
    .filter((event) => sameLocalDay(new Date(event.occurred_at), now))
    .reduce((sum, event) => sum + Number(event.points ?? 0), 0);
  const reviewAverage = params.reviews.length > 0
    ? params.reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / params.reviews.length
    : 0;
  const trustScore = reviewAverage > 0
    ? Math.round(reviewAverage * 2 * 10) / 10
    : Number(params.profile.trust_score ?? 0);

  return {
    sessions: {
      value: numberFormat(completedSessions.length),
      trend: `Bu hafta +${completedThisWeek.length}`,
    },
    teachingHours: {
      value: formatHours(teachingHours),
      trend: `Bugün +${formatHours(teachingHoursToday)}`,
    },
    skillPoints: {
      value: numberFormat(Number(params.profile.skill_points ?? 0)),
      trend: `Bugün +${numberFormat(pointsToday)}`,
    },
    trustScore: {
      value: formatTrustScore(trustScore),
      trend: `Top %${params.rankPercent}`,
    },
  };
}

export async function getHomeDashboard(): Promise<HomeDashboardData> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Ana sayfa verileri için giriş yapmış kullanıcı bulunamadı.");

  try {
    const profile = await fetchOrCreateProfile(user);
    const weekStart = toDateKey(startOfWeek());
    const weekEnd = toDateKey(endOfWeek());

    const [
      skills,
      { data: matchesData, error: matchesError },
      { data: sessionsData, error: sessionsError },
      { data: learningData, error: learningError },
      { data: pointData, error: pointError },
      { data: reviewData, error: reviewError },
      { data: achievementsData, error: achievementError },
      { count: messageCount, error: messageCountError },
      rankPercent,
      leaderboard,
    ] = await Promise.all([
      fetchUserSkills(user),
      supabase
        .from("matches")
        .select("id,user_id,matched_user_id,skill_name,matched_skill_name,status,match_score,distance_km,created_at")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("sessions")
        .select("id,title,skill_name,mentor_id,learner_id,scheduled_at,duration_minutes,delivery_type,status,color,emoji")
        .or(`mentor_id.eq.${user.id},learner_id.eq.${user.id}`)
        .gte("scheduled_at", new Date(new Date().getFullYear() - 1, 0, 1).toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(200),
      supabase
        .from("learning_activity")
        .select("activity_date,hours")
        .eq("user_id", user.id)
        .gte("activity_date", weekStart)
        .lte("activity_date", weekEnd),
      supabase
        .from("point_events")
        .select("points,occurred_at")
        .eq("user_id", user.id)
        .gte("occurred_at", weekStart),
      supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", user.id),
      supabase
        .from("user_achievements")
        .select("id,title,description,progress_current,progress_target,color")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .is("achieved_at", null)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "MESSAGE")
        .eq("is_read", false)
        .is("dismissed_at", null),
      getRankPercent(Number(profile.skill_points ?? 0)),
      getLeaderboard(profile, user),
    ]);

    if (matchesError) throw matchesError;
    if (sessionsError) throw sessionsError;
    if (learningError) throw learningError;
    if (pointError) throw pointError;
    if (reviewError) throw reviewError;
    if (achievementError) throw achievementError;
    if (messageCountError) throw messageCountError;

    const matches = (matchesData ?? []) as MatchRow[];
    const sessions = (sessionsData ?? []) as SessionRow[];
    const peerIds = [
      ...matches.map((match) => getPeerId(match, user.id)),
      ...sessions.map((session) => getSessionPeerId(session, user.id)),
    ];
    const peerProfiles = await fetchProfilesById(peerIds);
    const activeSkills = buildActiveSkills(skills);
    const weeklyLearning = buildWeeklyLearning((learningData ?? []) as LearningActivityRow[]);
    const upcomingSessions = buildUpcomingSessions(sessions, peerProfiles, user.id);
    const recentMatches = buildRecentMatches(matches, peerProfiles, user.id);
    const nextLevelPoints = Number(profile.next_level_points ?? 0);
    const skillPoints = Number(profile.skill_points ?? 0);
    const skillPointProgress = skillPoints + nextLevelPoints > 0
      ? clampPercent((skillPoints / (skillPoints + nextLevelPoints)) * 100)
      : 0;

    return {
      user: {
        id: user.id,
        firstName: getFirstName(profile, user),
        fullName: formatProfileName(profile),
        schoolInfo: getSchoolInfo(profile),
        avatarUrl: profile.avatar_url ?? null,
        skillPoints,
        trustScore: Number(profile.trust_score ?? 0),
        streakDays: Number(profile.streak_days ?? 0),
        nextLevelPoints,
      },
      stats: buildStats({
        sessions,
        points: (pointData ?? []) as PointEventRow[],
        reviews: (reviewData ?? []) as ReviewRow[],
        profile,
        rankPercent,
      }),
      weeklyLearning,
      activeSkills,
      nextAchievement: buildAchievement(((achievementsData ?? []) as AchievementRow[])[0]),
      recentMatches,
      upcomingSessions,
      leaderboard,
      sidebar: {
        matchCount: matches.filter((match) => !["declined", "rejected", "cancelled"].includes(match.status.toLowerCase())).length,
        messageCount: messageCount ?? 0,
        skillPoints,
        nextLevelPoints,
        skillPointProgress,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function searchHomeDirectory(query: string): Promise<HomeSearchResult[]> {
  const normalizedQuery = query.replace(/[,%()]/g, " ").trim();
  if (normalizedQuery.length < 2) return [];

  const pattern = `%${normalizedQuery}%`;

  const [{ data: profileData, error: profileError }, { data: skillData, error: skillError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,first_name,last_name,university,department")
        .eq("profile_public", true)
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},university.ilike.${pattern},department.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("user_skills")
        .select("id,name,kind,user_id")
        .ilike("name", pattern)
        .limit(5),
    ]);

  if (profileError) throw profileError;
  if (skillError) throw skillError;

  const profiles = ((profileData ?? []) as ProfileRow[]).map((profile) => ({
    id: profile.id,
    type: "profile" as const,
    title: formatProfileName(profile),
    subtitle: getSchoolInfo(profile),
  }));

  const skills = ((skillData ?? []) as UserSkillRow[]).map((skill) => ({
    id: skill.id,
    type: "skill" as const,
    title: skill.name,
    subtitle: skill.kind === "teaches" ? "Öğreten kullanıcılar" : "Öğrenmek isteyen kullanıcılar",
  }));

  return [...profiles, ...skills].slice(0, 8);
}
