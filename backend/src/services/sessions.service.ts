import { getPrismaClient } from "../lib/prisma.js";

export type CreateSessionParams = {
  mentorId: string;
  learnerId: string;
  title?: string;
  skillName?: string;
  scheduledAt: string;
  durationMinutes?: number;
  deliveryType?: string;
};

type SessionRow = {
  id: string;
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
};

function normalizeSession(row: SessionRow) {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    studentId: row.student_id,
    learnerId: row.learner_id,
    title: row.title ?? "Görüşme",
    skillName: row.skill_name ?? "",
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes ?? 60,
    deliveryType: row.delivery_type ?? "video",
    status: row.status ?? "scheduled",
    meetingLink: row.meeting_link,
    color: row.color ?? "#4338ca",
    emoji: row.emoji ?? "book",
    createdAt: row.created_at,
  };
}

function buildJitsiLink(params: CreateSessionParams) {
  const baseUrl = process.env.JITSI_BASE_URL || "https://meet.jit.si";
  const roomSeed = [
    "SkillBridge",
    params.mentorId.slice(0, 8),
    params.learnerId.slice(0, 8),
    new Date(params.scheduledAt).getTime().toString(36),
  ]
    .join("-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  return `${baseUrl.replace(/\/$/, "")}/${roomSeed}`;
}

export async function listSessions(userId: string) {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<SessionRow[]>`
    SELECT
      id,
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
      created_at
    FROM public.sessions
    WHERE mentor_id::text = ${userId}
       OR learner_id::text = ${userId}
       OR student_id::text = ${userId}
    ORDER BY scheduled_at ASC;
  `;

  return rows.map(normalizeSession);
}

export async function createSession(params: CreateSessionParams) {
  const prisma = getPrismaClient();
  const durationMinutes = Math.min(Math.max(Math.floor(params.durationMinutes ?? 60), 15), 240);
  const deliveryType = params.deliveryType?.trim() || "video";
  const meetingLink = deliveryType === "video" ? buildJitsiLink(params) : null;

  const rows = await prisma.$queryRaw<SessionRow[]>`
    INSERT INTO public.sessions (
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
      ${params.mentorId}::uuid,
      ${params.learnerId}::uuid,
      ${params.learnerId}::uuid,
      ${params.title?.trim() || "SkillBridge Görüşmesi"},
      ${params.skillName?.trim() || null},
      ${new Date(params.scheduledAt)},
      ${durationMinutes},
      ${deliveryType},
      'scheduled',
      ${meetingLink},
      '#4338ca',
      'book'
    )
    RETURNING
      id,
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
      created_at;
  `;

  return normalizeSession(rows[0]);
}
