import { apiGet, apiSend, withQuery } from "./api";

export type SessionStatus =
  | "pending"
  | "scheduled"
  | "declined"
  | "cancelled"
  | "completed";

export type SessionAction =
  | "accept"
  | "decline"
  | "cancel"
  | "reschedule"
  | "complete";

export type SessionScope = "invitations" | "upcoming" | "history";
export type SessionRole = "creator" | "invitee";

export type SkillBridgeSession = {
  id: string;
  matchId: string | null;
  mentorId: string | null;
  learnerId: string | null;
  studentId: string | null;
  title: string;
  skillName: string;
  scheduledAt: string;
  durationMinutes: number;
  deliveryType: string;
  status: SessionStatus;
  meetingLink: string | null;
  color: string;
  emoji: string;
  createdAt: string;
  role: SessionRole;
  invitationDirection: "incoming" | "outgoing";
  peer: {
    id: string | null;
    name: string;
    avatarUrl: string | null;
  };
  permissions: {
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
    canReschedule: boolean;
    canComplete: boolean;
    canJoin: boolean;
    canGiveFeedback: boolean;
  };
};

export type SessionCounts = {
  invitations: number;
  incomingInvitations: number;
  upcoming: number;
  history: number;
};

export type SessionListResponse = {
  data: SkillBridgeSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: SessionCounts;
};

export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; className: string }
> = {
  pending: {
    label: "Onay bekliyor",
    color: "#f59e0b",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  scheduled: {
    label: "Planlandı",
    color: "#10b981",
    className: "bg-green-500/10 text-green-700 dark:text-green-300",
  },
  declined: {
    label: "Reddedildi",
    color: "#ef4444",
    className: "bg-red-500/10 text-red-600",
  },
  cancelled: {
    label: "İptal edildi",
    color: "#64748b",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  completed: {
    label: "Tamamlandı",
    color: "#6366f1",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
};

export function getSessionStatusConfig(status: SessionStatus) {
  return SESSION_STATUS_CONFIG[status] ?? SESSION_STATUS_CONFIG.pending;
}

export function getSessionScope(status: SessionStatus): SessionScope {
  if (status === "pending") return "invitations";
  if (status === "scheduled") return "upcoming";
  return "history";
}

export async function listSessions(params: {
  from?: string;
  to?: string;
  status?: string;
  scope?: SessionScope;
  q?: string;
  role?: SessionRole;
  page?: number;
  limit?: number;
}) {
  return apiGet<SessionListResponse>(
    withQuery("/api/sessions", params),
  );
}

export async function listCalendarSessions(from: string, to: string) {
  const firstPage = await listSessions({
    from,
    to,
    page: 1,
    limit: 50,
  });
  if (firstPage.totalPages <= 1) return firstPage.data;

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.totalPages - 1 },
      (_, index) =>
        listSessions({
          from,
          to,
          page: index + 2,
          limit: 50,
        }),
    ),
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((response) => response.data),
  ];
}

export async function getSession(sessionId: string) {
  const response = await apiGet<{ data: SkillBridgeSession }>(
    `/api/sessions/${sessionId}`,
  );
  return response.data;
}

export async function createSession(payload: {
  matchId: string;
  learnerId: string;
  title: string;
  skillName: string;
  scheduledAt: string;
  durationMinutes: number;
}) {
  const response = await apiSend<{ data: SkillBridgeSession }>(
    "/api/sessions",
    "POST",
    payload,
  );
  return response.data;
}

export async function updateSession(
  sessionId: string,
  action: SessionAction,
  payload?: {
    scheduledAt?: string;
    durationMinutes?: number;
  },
) {
  const response = await apiSend<{ data: SkillBridgeSession }>(
    `/api/sessions/${sessionId}`,
    "PATCH",
    { action, ...payload },
  );
  return response.data;
}
