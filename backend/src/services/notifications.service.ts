import { getPrismaClient } from "../lib/prisma.js";

export type NotificationType =
  | "MATCH"
  | "MESSAGE"
  | "SESSION"
  | "FEEDBACK"
  | "SYSTEM";

export type NotificationActionStatus =
  | "none"
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

export type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actorId?: string | null;
  actionStatus?: NotificationActionStatus;
  metadata?: Record<string, unknown>;
  relatedUrl?: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  description: string;
  type: string;
  content: string;
  actor_name: string | null;
  actor_avatar_url: string | null;
  action_status: NotificationActionStatus;
  metadata: unknown;
  related_url: string | null;
  is_read: boolean;
  read_at: Date | null;
  dismissed_at: Date | null;
  created_at: Date;
};

type NotificationActionRow = NotificationRow & {
  session_id: string | null;
};

export class NotificationActionError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "FORBIDDEN" | "INVALID_ACTION",
    message: string,
  ) {
    super(message);
  }
}

function selectNotificationColumns() {
  return `
    id,
    user_id,
    title,
    message,
    description,
    type,
    content,
    actor_name,
    actor_avatar_url,
    action_status,
    metadata,
    related_url,
    is_read,
    read_at,
    dismissed_at,
    created_at
  `;
}

export async function createNotification(params: CreateNotificationParams) {
  const prisma = getPrismaClient();
  const metadata = JSON.stringify(params.metadata ?? {});
  const actorId = params.actorId ?? null;
  const actionStatus = params.actionStatus ?? "none";

  const rows = await prisma.$queryRawUnsafe<NotificationRow[]>(
    `
      WITH actor AS (
        SELECT
          coalesce(
            nullif(btrim(full_name), ''),
            nullif(btrim(concat_ws(' ', first_name, last_name)), ''),
            'SkillBridge Kullanıcısı'
          ) AS actor_name,
          avatar_url AS actor_avatar_url
        FROM public.profiles
        WHERE id = $1::uuid
      )
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        description,
        type,
        content,
        actor_name,
        actor_avatar_url,
        action_status,
        metadata,
        related_url
      )
      SELECT
        $2::uuid,
        $3,
        $4,
        $4,
        $5,
        $4,
        actor.actor_name,
        actor.actor_avatar_url,
        $6,
        $7::jsonb,
        $8
      FROM (SELECT 1) AS seed
      LEFT JOIN actor ON true
      RETURNING ${selectNotificationColumns()};
    `,
    actorId,
    params.userId,
    params.title.trim(),
    params.message.trim(),
    params.type,
    actionStatus,
    metadata,
    params.relatedUrl ?? null,
  );

  return rows[0];
}

export async function createNotificationSafely(
  params: CreateNotificationParams,
) {
  try {
    return await createNotification(params);
  } catch (error) {
    console.error("Notification creation error:", {
      type: params.type,
      userId: params.userId,
      error,
    });
    return null;
  }
}

export async function resolveSessionInvitationNotifications(
  sessionId: string,
  actionStatus: Extract<
    NotificationActionStatus,
    "accepted" | "declined" | "cancelled"
  >,
  userId?: string,
) {
  const prisma = getPrismaClient();

  await prisma.$executeRaw`
    UPDATE public.notifications
    SET
      action_status = ${actionStatus},
      is_read = true,
      read_at = coalesce(read_at, now())
    WHERE upper(type) = 'SESSION'
      AND action_status = 'pending'
      AND metadata ->> 'sessionId' = ${sessionId}
      AND (${userId ?? null}::text IS NULL OR user_id::text = ${userId ?? null});
  `;
}

export async function getNotificationAction(
  notificationId: string,
  userId: string,
  actionStatus: "accepted" | "declined",
) {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRawUnsafe<NotificationActionRow[]>(
    `
      SELECT
        ${selectNotificationColumns()},
        metadata ->> 'sessionId' AS session_id
      FROM public.notifications
      WHERE id = $1::uuid
        AND user_id = $2::uuid
      LIMIT 1;
    `,
    notificationId,
    userId,
  );
  const notification = rows[0];

  if (!notification) {
    throw new NotificationActionError(
      "NOT_FOUND",
      "Bildirim bulunamadı.",
    );
  }
  if (
    notification.type.toUpperCase() !== "SESSION" ||
    notification.action_status !== "pending"
  ) {
    throw new NotificationActionError(
      "FORBIDDEN",
      "Bu bildirim için işlem yapılamaz.",
    );
  }
  if (!notification.session_id) {
    throw new NotificationActionError(
      "INVALID_ACTION",
      "Bildirim bir görüşme davetiyle ilişkilendirilmemiş.",
    );
  }

  return {
    notification,
    sessionId: notification.session_id,
    sessionAction: actionStatus === "accepted" ? "accept" : "decline",
  } as const;
}

export async function getNotificationById(
  notificationId: string,
  userId: string,
) {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRawUnsafe<NotificationRow[]>(
    `
      SELECT ${selectNotificationColumns()}
      FROM public.notifications
      WHERE id = $1::uuid
        AND user_id = $2::uuid
      LIMIT 1;
    `,
    notificationId,
    userId,
  );

  if (!rows[0]) {
    throw new NotificationActionError("NOT_FOUND", "Bildirim bulunamadı.");
  }

  return rows[0];
}
