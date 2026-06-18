import { apiGet, withQuery } from "./api";

export type ProgressData = {
  generatedAt: string;
  year: number;
  summary: {
    totalHours: number;
    currentStreak: number;
    completedSessions: number;
    skillPoints: number;
  };
  skills: {
    id: string;
    name: string;
    kind: string;
    progress: number;
    color: string;
    emoji: string;
    completedSessions: number;
    hours: number;
    level: string;
    nextLevel: string | null;
    pointsToNext: number;
  }[];
  weeklyLearning: {
    series: { key: string; name: string; color: string }[];
    data: Record<string, string | number>[];
  };
  radar: { skill: string; value: number }[];
  monthlyLearning: {
    totalHours: number;
    data: { month: string; hours: number }[];
  };
  activeAchievement: {
    id: string;
    title: string;
    description: string;
    progressCurrent: number;
    progressTarget: number;
    progressPercent: number;
    color: string;
  } | null;
};

export async function getProgress(year: number) {
  const response = await apiGet<{ data: ProgressData }>(
    withQuery("/api/progress", { year }),
  );
  return response.data;
}
