import { supabase } from "./supabase";

export type NotificationType = "MATCH" | "MESSAGE" | "SESSION" | "FEEDBACK" | "SYSTEM";
export type NotificationActionStatus = "none" | "pending" | "accepted" | "declined";

interface NotificationRow {
  id: string;
  user_id?: string | null;
  type: string;
  content: string;
  is_read?: boolean | null;
  dismissed_at?: string | null;
  created_at: string;
}

export interface SkillBridgeNotification {
  id: string;
  user_id: string | null;
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

function getNotificationTitle(type: NotificationType) {
  if (type === "MATCH") return "Eşleşme bildirimi";
  if (type === "MESSAGE") return "Yeni mesaj";
  if (type === "SESSION") return "Görüşme bildirimi";
  if (type === "FEEDBACK") return "Geri bildirim";
  return "Bildirim";
}

function normalizeNotification(row: NotificationRow): SkillBridgeNotification {
  const type = normalizeNotificationType(row.type);
  const message = row.content || "";

  return {
    id: row.id,
    user_id: row.user_id ?? null,
    type,
    title: getNotificationTitle(type),
    message,
    description: message,
    actor_name: null,
    actor_avatar_url: null,
    action_status: "none",
    metadata: {},
    is_read: row.is_read ?? false,
    relatedUrl: null,
    related_url: null,
    read_at: null,
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
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return normalizeNotification(data as NotificationRow);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("dismissed_at", null);

  if (error) throw error;
  return new Date().toISOString();
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
  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return normalizeNotification(data as NotificationRow);
}
