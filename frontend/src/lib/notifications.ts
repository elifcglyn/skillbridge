import { apiSend } from "./api";
import { supabase } from "./supabase";

export type NotificationType = "MATCH" | "MESSAGE" | "SESSION" | "FEEDBACK" | "SYSTEM";
export type NotificationActionStatus =
  | "none"
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

interface NotificationRow {
  id: string;
  user_id?: string | null;
  type: string;
  title?: string | null;
  message?: string | null;
  description?: string | null;
  content?: string | null;
  actor_name?: string | null;
  actor_avatar_url?: string | null;
  action_status?: string | null;
  metadata?: unknown;
  related_url?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
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

function normalizeActionStatus(value?: string | null): NotificationActionStatus {
  if (value === "pending") return "pending";
  if (value === "accepted") return "accepted";
  if (value === "declined") return "declined";
  if (value === "cancelled") return "cancelled";
  return "none";
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeNotification(row: NotificationRow): SkillBridgeNotification {
  const type = normalizeNotificationType(row.type);
  const message = row.message || row.description || row.content || "";
  const relatedUrl = row.related_url ?? null;

  return {
    id: row.id,
    user_id: row.user_id ?? null,
    type,
    title: row.title?.trim() || getNotificationTitle(type),
    message,
    description: row.description || message,
    actor_name: row.actor_name ?? null,
    actor_avatar_url: row.actor_avatar_url ?? null,
    action_status: normalizeActionStatus(row.action_status),
    metadata: normalizeMetadata(row.metadata),
    is_read: row.is_read ?? false,
    relatedUrl,
    related_url: relatedUrl,
    read_at: row.read_at ?? null,
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
  const response = await apiSend<{ data: NotificationRow }>(
    `/api/notifications/${notificationId}/action`,
    "POST",
    { actionStatus },
  );
  return normalizeNotification(response.data);
}
