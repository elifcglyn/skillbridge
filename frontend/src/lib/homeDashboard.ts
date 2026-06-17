import { apiGet, withQuery } from "./api";
import { supabase } from "./supabase";

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
    meetingLink?: string | null;
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
    notificationCount?: number;
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

function formatProfileName(profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) {
  const explicitName = profile.full_name?.trim();
  if (explicitName) return explicitName;
  const composedName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return composedName || "SkillBridge Kullanıcısı";
}

function getSchoolInfo(profile: { university?: string | null; department?: string | null }) {
  const university = profile.university?.trim();
  const department = profile.department?.trim();
  if (!university) return "Üniversite Öğrencisi";
  return department ? `${university} · ${department}` : university;
}

export async function getHomeDashboard(): Promise<HomeDashboardData> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Ana sayfa verileri için giriş yapmış kullanıcı bulunamadı.");

  const response = await apiGet<{ data: HomeDashboardData }>(
    withQuery("/api/dashboard", { userId: user.id }),
  );

  return response.data;
}

export async function searchHomeDirectory(query: string): Promise<HomeSearchResult[]> {
  const normalizedQuery = query.replace(/[,%()]/g, " ").trim();
  if (normalizedQuery.length < 2) return [];

  const pattern = `%${normalizedQuery}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,first_name,last_name,university,department,teaches,learns")
    .or(`full_name.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},university.ilike.${pattern},department.ilike.${pattern}`)
    .limit(8);

  if (error) throw error;

  return (data ?? []).map((profile: any) => ({
    id: profile.id,
    type: "profile" as const,
    title: formatProfileName(profile),
    subtitle: getSchoolInfo(profile),
  }));
}
