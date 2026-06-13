import { supabase } from "./supabase";

export type NotificationType = "MATCH" | "MESSAGE" | "SESSION" | "FEEDBACK" | "SYSTEM";
export type NotificationActionStatus = "none" | "pending" | "accepted" | "declined";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  description?: string | null;
  actor_name?: string | null;
  actor_avatar_url?: string | null;
  action_status?: NotificationActionStatus | null;
  metadata?: Record<string, unknown> | null;
  is_read?: boolean | null;
  related_url?: string | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  created_at: string;
}

export interface SkillBridgeNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  description: string;
  actor_name: string | null;
  actor_avatar_url: string | null;
  action_status: NotificationActionStatus;
  metadata: Record<string, unknown>;
  is_read: boolean;
  relatedUrl: string | null;
  related_url: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

function normalizeNotificationType(type: string): NotificationType {
  const normalizedType = type.toUpperCase();

  if (normalizedType === "MATCH") return "MATCH";
  if (normalizedType === "MESSAGE") return "MESSAGE";
  if (normalizedType === "SESSION") return "SESSION";
  if (normalizedType === "FEEDBACK" || normalizedType === "REVIEW") return "FEEDBACK";

  return "SYSTEM";
}

function normalizeNotification(row: NotificationRow): SkillBridgeNotification {
  const message = row.message || row.description || "";
  const readAt = row.read_at ?? null;

  return {
    id: row.id,
    user_id: row.user_id,
    type: normalizeNotificationType(row.type),
    title: row.title,
    message,
    description: message,
    actor_name: row.actor_name ?? null,
    actor_avatar_url: row.actor_avatar_url ?? null,
    action_status: row.action_status ?? "none",
    metadata: row.metadata ?? {},
    is_read: row.is_read ?? Boolean(readAt),
    relatedUrl: row.related_url ?? null,
    related_url: row.related_url ?? null,
    read_at: readAt,
    dismissed_at: row.dismissed_at ?? null,
    created_at: row.created_at,
  };
}

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(normalizeNotification);
}

export async function markNotificationRead(notificationId: string) {
  const readAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: readAt })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return normalizeNotification(data as NotificationRow);
}

export async function markAllNotificationsRead(userId: string) {
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: readAt })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("dismissed_at", null);

  if (error) throw error;
  return readAt;
}

export async function dismissNotification(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return normalizeNotification(data as NotificationRow);
}

export async function updateNotificationActionStatus(
  notificationId: string,
  actionStatus: Extract<NotificationActionStatus, "accepted" | "declined">,
) {
  const readAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("notifications")
    .update({
      action_status: actionStatus,
      is_read: true,
      read_at: readAt,
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return normalizeNotification(data as NotificationRow);
}
