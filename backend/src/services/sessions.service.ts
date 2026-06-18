import { getPrismaClient } from "../lib/prisma.js";
import {
  createNotificationSafely,
  resolveSessionInvitationNotifications,
} from "./notifications.service.js";

const TERMINAL_STATUSES = new Set(["declined", "cancelled", "completed"]);
const ALLOWED_DURATIONS = new Set([30, 45, 60, 90]);

export type CreateSessionParams = {
  mentorId: string;
  learnerId: string;
  matchId: string;
  title?: string;
  skillName?: string;
  scheduledAt: string;
  durationMinutes?: number;
};

export type ListSessionsParams = {
  userId: string;
  from?: string;
  to?: string;
  statuses?: string[];
};

export type SessionAction =
  | "accept"
  | "decline"
  | "cancel"
  | "reschedule"
  | "complete";

export type UpdateSessionParams = {
  userId: string;
  sessionId: string;
  action: SessionAction;
  scheduledAt?: string;
  durationMinutes?: number;
};

type SessionRow = {
  id: string;
  match_id: string | null;
  mentor_id: string | null;
  student_id: string | null;
  learner_id: string | null;
  title: string | null;
  skill_name: string | null;
  scheduled_at: Date;
  duration_minutes: number | null;
  delivery_type: string | null;
  status: string | null;
  meeting_link: string | null;
  color: string | null;
  emoji: string | null;
  created_at: Date;
  peer_id: string | null;
  peer_full_name: string | null;
  peer_first_name: string | null;
  peer_last_name: string | null;
  peer_avatar_url: string | null;
};

type MatchParticipantRow = {
  id: string;
  first_user_id: string;
  second_user_id: string;
  skill_name: string | null;
};

export class SessionActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function normalizeStatus(status?: string | null) {
  return (status || "pending").toLowerCase();
}

function normalizeDuration(value?: number) {
  const duration = Math.floor(value ?? 60);
  if (!ALLOWED_DURATIONS.has(duration)) {
    throw new SessionActionError(
      "INVALID_DURATION",
      "Görüşme süresi 30, 45, 60 veya 90 dakika olmalıdır.",
    );
  }
  return duration;
}

function peerName(row: SessionRow) {
  return (
    row.peer_full_name?.trim() ||
    [row.peer_first_name, row.peer_last_name].filter(Boolean).join(" ").trim() ||
    "SkillBridge Kullanıcısı"
  );
}

function buildJitsiLink(mentorId: string, learnerId: string, scheduledAt: Date) {
  const baseUrl = process.env.JITSI_BASE_URL || "https://meet.jit.si";
  const roomSeed = [
    "SkillBridge",
    mentorId.slice(0, 8),
    learnerId.slice(0, 8),
    scheduledAt.getTime().toString(36),
  ]
    .join("-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  return `${baseUrl.replace(/\/$/, "")}/${roomSeed}`;
}

function normalizeSession(row: SessionRow, userId: string) {
  const status = normalizeStatus(row.status);
  const isMentor = row.mentor_id === userId;
  const isLearner = row.learner_id === userId || row.student_id === userId;
  const scheduledEnd =
    row.scheduled_at.getTime() + (row.duration_minutes ?? 60) * 60 * 1000;
  const isTerminal = TERMINAL_STATUSES.has(status);

  return {
    id: row.id,
    matchId: row.match_id,
    mentorId: row.mentor_id,
    studentId: row.student_id,
    learnerId: row.learner_id,
    title: row.title ?? "Görüşme",
    skillName: row.skill_name ?? "",
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes ?? 60,
    deliveryType: row.delivery_type ?? "video",
    status,
    meetingLink: row.meeting_link,
    color: row.color ?? "#4338ca",
    emoji: row.emoji ?? "book",
    createdAt: row.created_at,
    peer: {
      id: row.peer_id,
      name: peerName(row),
      avatarUrl: row.peer_avatar_url,
    },
    permissions: {
      canAccept: status === "pending" && isLearner,
      canDecline: status === "pending" && isLearner,
      canCancel: !isTerminal && ["pending", "scheduled"].includes(status) && (isMentor || isLearner),
      canReschedule: !isTerminal && ["pending", "scheduled"].includes(status) && isMentor,
      canComplete: status === "scheduled" && isMentor && scheduledEnd <= Date.now(),
    },
  };
}

async function syncSessionNotifications(
  current: SessionRow,
  action: SessionAction,
  actorId: string,
) {
  const mentorId = current.mentor_id;
  const learnerId = current.learner_id ?? current.student_id;
  const sessionId = current.id;
  const skillName = current.skill_name?.trim() || "Beceri paylaşımı";
  const metadata = {
    sessionId,
    matchId: current.match_id,
    peerId: actorId,
    skillName,
  };

  if (!mentorId || !learnerId) return;

  try {
    if (action === "accept") {
      await resolveSessionInvitationNotifications(
        sessionId,
        "accepted",
        learnerId,
      );
      await createNotificationSafely({
        userId: mentorId,
        actorId,
        type: "SESSION",
        title: "Görüşme daveti kabul edildi",
        message: `${skillName} görüşme davetin kabul edildi.`,
        metadata,
        relatedUrl: "calendar",
      });
      return;
    }

    if (action === "decline") {
      await resolveSessionInvitationNotifications(
        sessionId,
        "declined",
        learnerId,
      );
      await createNotificationSafely({
        userId: mentorId,
        actorId,
        type: "SESSION",
        title: "Görüşme daveti reddedildi",
        message: `${skillName} görüşme davetin reddedildi.`,
        metadata,
        relatedUrl: "calendar",
      });
      return;
    }

    if (action === "cancel") {
      await resolveSessionInvitationNotifications(sessionId, "cancelled");
      const recipientId = actorId === mentorId ? learnerId : mentorId;
      await createNotificationSafely({
        userId: recipientId,
        actorId,
        type: "SESSION",
        title: "Görüşme iptal edildi",
        message: `${skillName} görüşmesi iptal edildi.`,
        metadata,
        relatedUrl: "calendar",
      });
      return;
    }

    if (action === "reschedule") {
      await resolveSessionInvitationNotifications(sessionId, "cancelled");
      await createNotificationSafely({
        userId: learnerId,
        actorId,
        type: "SESSION",
        title: "Görüşme yeniden planlandı",
        message: `${skillName} görüşmesi için yeni tarih onayını bekliyor.`,
        actionStatus: "pending",
        metadata,
        relatedUrl: "calendar",
      });
      return;
    }

    if (action === "complete") {
      await createNotificationSafely({
        userId: learnerId,
        actorId,
        type: "SESSION",
        title: "Görüşme tamamlandı",
        message: `${skillName} görüşmesi tamamlandı olarak işaretlendi.`,
        metadata,
        relatedUrl: "calendar",
      });
    }
  } catch (error) {
    console.error("Session notification sync error:", {
      sessionId,
      action,
      error,
    });
  }
}

async function querySessions(
  userId: string,
  fromDate: Date | null,
  toDate: Date | null,
  sessionId?: string,
) {
  const prisma = getPrismaClient();
  return prisma.$queryRaw<SessionRow[]>`
    SELECT
      sessions.id,
      sessions.match_id,
      sessions.mentor_id,
      sessions.student_id,
      sessions.learner_id,
      sessions.title,
      sessions.skill_name,
      sessions.scheduled_at,
      sessions.duration_minutes,
      sessions.delivery_type,
      sessions.status,
      sessions.meeting_link,
      sessions.color,
      sessions.emoji,
      sessions.created_at,
      profiles.id AS peer_id,
      profiles.full_name AS peer_full_name,
      profiles.first_name AS peer_first_name,
      profiles.last_name AS peer_last_name,
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
      AND (${sessionId ?? null}::text IS NULL OR sessions.id::text = ${sessionId ?? null})
      AND (${fromDate}::timestamptz IS NULL OR sessions.scheduled_at >= ${fromDate})
      AND (${toDate}::timestamptz IS NULL OR sessions.scheduled_at < ${toDate})
    ORDER BY sessions.scheduled_at ASC;
  `;
}

export async function listSessions({
  userId,
  from,
  to,
  statuses,
}: ListSessionsParams) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const rows = await querySessions(userId, fromDate, toDate);
  const statusSet = new Set((statuses ?? []).map((status) => status.toLowerCase()));

  return rows
    .filter((row) => statusSet.size === 0 || statusSet.has(normalizeStatus(row.status)))
    .map((row) => normalizeSession(row, userId));
}

export async function createSession(params: CreateSessionParams) {
  const prisma = getPrismaClient();
  const scheduledAt = new Date(params.scheduledAt);
  const durationMinutes = normalizeDuration(params.durationMinutes);

  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    throw new SessionActionError(
      "INVALID_DATE",
      "Görüşme tarihi gelecekte olmalıdır.",
    );
  }

  const matches = await prisma.$queryRaw<MatchParticipantRow[]>`
    SELECT
      matches.id,
      matches.user_id AS first_user_id,
      matches.matched_user_id AS second_user_id,
      coalesce(nullif(matches.skill_name, ''), nullif(matches.matched_skill_name, '')) AS skill_name
    FROM public.matches
    WHERE matches.id::text = ${params.matchId}
      AND lower(coalesce(matches.status::text, 'recommended'))
        NOT IN ('rejected', 'declined', 'cancelled')
      AND (
        (
          matches.user_id::text = ${params.mentorId}
          AND matches.matched_user_id::text = ${params.learnerId}
        )
        OR (
          matches.user_id::text = ${params.learnerId}
          AND matches.matched_user_id::text = ${params.mentorId}
        )
      )
    LIMIT 1;
  `;

  if (matches.length === 0) {
    throw new SessionActionError(
      "MATCH_REQUIRED",
      "Bu kullanıcıyla görüşme planlamak için aktif bir beceri eşleşmesi gereklidir.",
    );
  }

  const skillName =
    params.skillName?.trim() ||
    matches[0].skill_name?.trim() ||
    "Beceri paylaşımı";

  const rows = await prisma.$queryRaw<SessionRow[]>`
    INSERT INTO public.sessions (
      match_id,
      mentor_id,
      student_id,
      learner_id,
      title,
      skill_name,
      scheduled_at,
      duration_minutes,
      delivery_type,
      status,
      meeting_link,
      color,
      emoji
    )
    VALUES (
      ${params.matchId}::uuid,
      ${params.mentorId}::uuid,
      ${params.learnerId}::uuid,
      ${params.learnerId}::uuid,
      ${params.title?.trim() || `${skillName} Görüşmesi`},
      ${skillName},
      ${scheduledAt},
      ${durationMinutes},
      'video',
      'pending',
      NULL,
      '#4338ca',
      'book'
    )
    RETURNING
      id,
      match_id,
      mentor_id,
      student_id,
      learner_id,
      title,
      skill_name,
      scheduled_at,
      duration_minutes,
      delivery_type,
      status,
      meeting_link,
      color,
      emoji,
      created_at,
      NULL::uuid AS peer_id,
      NULL::text AS peer_full_name,
      NULL::text AS peer_first_name,
      NULL::text AS peer_last_name,
      NULL::text AS peer_avatar_url;
  `;

  const [created] = await querySessions(params.mentorId, null, null, rows[0].id);
  await createNotificationSafely({
    userId: params.learnerId,
    actorId: params.mentorId,
    type: "SESSION",
    title: "Yeni görüşme daveti",
    message: `${skillName} için yeni bir görüşme davetin var.`,
    actionStatus: "pending",
    metadata: {
      sessionId: created.id,
      matchId: created.match_id,
      peerId: params.mentorId,
      skillName,
    },
    relatedUrl: "calendar",
  });
  return normalizeSession(created, params.mentorId);
}

export async function updateSession(params: UpdateSessionParams) {
  const prisma = getPrismaClient();
  const [current] = await querySessions(params.userId, null, null, params.sessionId);

  if (!current) {
    throw new SessionActionError("NOT_FOUND", "Görüşme bulunamadı.");
  }

  const status = normalizeStatus(current.status);
  if (TERMINAL_STATUSES.has(status)) {
    throw new SessionActionError(
      "TERMINAL_STATUS",
      "Bu görüşme için artık işlem yapılamaz.",
    );
  }

  const isMentor = current.mentor_id === params.userId;
  const isLearner =
    current.learner_id === params.userId || current.student_id === params.userId;

  if (params.action === "accept") {
    if (!isLearner || status !== "pending") {
      throw new SessionActionError("FORBIDDEN", "Bu daveti kabul etme yetkiniz yok.");
    }
    if (current.scheduled_at.getTime() <= Date.now()) {
      throw new SessionActionError("INVALID_DATE", "Geçmiş tarihli davet kabul edilemez.");
    }

    const meetingLink = buildJitsiLink(
      current.mentor_id!,
      current.learner_id ?? current.student_id!,
      current.scheduled_at,
    );
    await prisma.$executeRaw`
      UPDATE public.sessions
      SET status = 'scheduled', meeting_link = ${meetingLink}
      WHERE id::text = ${params.sessionId} AND lower(status) = 'pending';
    `;
  } else if (params.action === "decline") {
    if (!isLearner || status !== "pending") {
      throw new SessionActionError("FORBIDDEN", "Bu daveti reddetme yetkiniz yok.");
    }
    await prisma.$executeRaw`
      UPDATE public.sessions
      SET status = 'declined', meeting_link = NULL
      WHERE id::text = ${params.sessionId} AND lower(status) = 'pending';
    `;
  } else if (params.action === "cancel") {
    if (!(isMentor || isLearner) || !["pending", "scheduled"].includes(status)) {
      throw new SessionActionError("FORBIDDEN", "Bu görüşmeyi iptal etme yetkiniz yok.");
    }
    await prisma.$executeRaw`
      UPDATE public.sessions
      SET status = 'cancelled', meeting_link = NULL
      WHERE id::text = ${params.sessionId};
    `;
  } else if (params.action === "reschedule") {
    if (!isMentor || !["pending", "scheduled"].includes(status)) {
      throw new SessionActionError("FORBIDDEN", "Bu görüşmeyi yeniden planlama yetkiniz yok.");
    }
    const scheduledAt = new Date(params.scheduledAt ?? "");
    if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new SessionActionError("INVALID_DATE", "Yeni tarih gelecekte olmalıdır.");
    }
    const durationMinutes = normalizeDuration(
      params.durationMinutes ?? current.duration_minutes ?? 60,
    );
    await prisma.$executeRaw`
      UPDATE public.sessions
      SET
        scheduled_at = ${scheduledAt},
        duration_minutes = ${durationMinutes},
        status = 'pending',
        meeting_link = NULL
      WHERE id::text = ${params.sessionId};
    `;
  } else if (params.action === "complete") {
    const scheduledEnd =
      current.scheduled_at.getTime() +
      (current.duration_minutes ?? 60) * 60 * 1000;
    if (!isMentor || status !== "scheduled" || scheduledEnd > Date.now()) {
      throw new SessionActionError(
        "FORBIDDEN",
        "Bu görüşme henüz tamamlandı olarak işaretlenemez.",
      );
    }
    await prisma.$executeRaw`
      UPDATE public.sessions
      SET status = 'completed'
      WHERE id::text = ${params.sessionId} AND lower(status) = 'scheduled';
    `;
  }

  const [updated] = await querySessions(params.userId, null, null, params.sessionId);
  await syncSessionNotifications(current, params.action, params.userId);
  return normalizeSession(updated, params.userId);
}
