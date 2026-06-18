import { apiGet, withQuery } from "./api";

export interface HomeDashboardData {
  generatedAt: string;
  user: {
    id: string;
    firstName: string;
    fullName: string;
    schoolInfo: string;
    avatarUrl: string | null;
    skillPoints: number;
    coinBalance: number;
    trustScore: number;
    reviewCount: number;
    streakDays: number;
    nextLevelPoints: number;
    pointsToNextLevel: number;
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
  activeSkills: {
    id: string;
    name: string;
    kind: string;
    progress: number;
    sessionsCompleted: number;
    hours: number;
    fill: string;
  }[];
  nextAchievement: {
    id: string;
    title: string;
    description: string;
    progressPercent: number;
    color: string;
  } | null;
  recentMatches: {
    id: string;
    otherUserId: string;
    name: string;
    skill: string;
    avatar: string | null;
    rating: number;
    reviewCount: number;
    distance: string;
    online: boolean;
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    peerId: string | null;
    peerName: string;
    peerAvatarUrl: string | null;
    scheduledAt: string;
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
    sessionCount: number;
    notificationCount: number;
    skillPoints: number;
    coinBalance: number;
    nextLevelPoints: number;
    pointsToNextLevel: number;
    skillPointProgress: number;
  };
}

export interface HomeSearchResult {
  id: string;
  type: "profile" | "skill";
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  matched: boolean;
  action: "messages" | "findmatch";
}

export async function getHomeDashboard(): Promise<HomeDashboardData> {
  const response = await apiGet<{ data: HomeDashboardData }>("/api/dashboard");
  return response.data;
}

export async function searchHomeDirectory(query: string): Promise<HomeSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const response = await apiGet<{ data: HomeSearchResult[] }>(
    withQuery("/api/dashboard/search", { q: normalizedQuery }),
  );
  return response.data;
}
