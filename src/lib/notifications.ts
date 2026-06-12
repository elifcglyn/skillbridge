import { supabase } from "./supabase";

export type NotificationType =
  | "match"
  | "message"
  | "session"
  | "achievement"
  | "points"
  | "review"
  | "suggestion";

export type NotificationActionStatus = "none" | "pending" | "accepted" | "declined";

export interface SkillBridgeNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description: string;
  actor_name: string | null;
  actor_avatar_url: string | null;
  action_status: NotificationActionStatus;
  metadata: Record<string, unknown>;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

interface DevNotificationSeed {
  type: NotificationType;
  title: string;
  description: string;
  actor_name?: string;
  actor_avatar_url?: string;
  action_status?: NotificationActionStatus;
  unread: boolean;
  ageMs: number;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DEV_NOTIFICATION_SEEDS: DevNotificationSeed[] = [
  {
    type: "match",
    title: "New Match!",
    description: "Priya Sharma wants to learn Python from you. She teaches React!",
    actor_name: "Priya Sharma",
    actor_avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop",
    action_status: "pending",
    unread: true,
    ageMs: 2 * MINUTE,
  },
  {
    type: "message",
    title: "Message from Aria",
    description: "See you tomorrow at 3pm! Ready to deep dive into decorators",
    actor_name: "Aria Chen",
    actor_avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    unread: true,
    ageMs: 8 * MINUTE,
  },
  {
    type: "session",
    title: "Session Reminder",
    description: "Your Python session with Aria Chen starts in 1 hour",
    actor_name: "Aria Chen",
    unread: true,
    ageMs: 45 * MINUTE,
  },
  {
    type: "achievement",
    title: "Achievement Unlocked!",
    description: "You earned the '7 Day Streak' badge. Keep it up!",
    unread: true,
    ageMs: 2 * HOUR,
  },
  {
    type: "match",
    title: "New Match!",
    description: "Tom Walker (Spanish Tutor) matched with your profile. 92% compatibility!",
    actor_name: "Tom Walker",
    actor_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop",
    action_status: "pending",
    unread: false,
    ageMs: 3 * HOUR,
  },
  {
    type: "points",
    title: "Skill Points Earned",
    description: "You earned 180 points from your session with Aria Chen!",
    actor_name: "Aria Chen",
    unread: false,
    ageMs: DAY,
  },
  {
    type: "review",
    title: "New Review",
    description: "Aria Chen gave you 5 stars - 'Excellent student, very engaged!'",
    actor_name: "Aria Chen",
    unread: false,
    ageMs: DAY,
  },
  {
    type: "suggestion",
    title: "Profile Suggestion",
    description: "Add your availability to get 3x more match requests this week",
    unread: false,
    ageMs: 2 * DAY,
  },
];

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SkillBridgeNotification[];
}

export async function markNotificationRead(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data as SkillBridgeNotification;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .is("dismissed_at", null);

  if (error) throw error;
}

export async function dismissNotification(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data as SkillBridgeNotification;
}

export async function updateNotificationActionStatus(
  notificationId: string,
  actionStatus: Extract<NotificationActionStatus, "accepted" | "declined">,
) {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      action_status: actionStatus,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data as SkillBridgeNotification;
}

export async function seedDevNotificationsIfNeeded(userId: string) {
  if (!import.meta.env.DEV) return;

  const { count, error: countError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  const now = Date.now();
  const rows = DEV_NOTIFICATION_SEEDS.map((notification) => {
    const createdAt = new Date(now - notification.ageMs).toISOString();

    return {
      user_id: userId,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      actor_name: notification.actor_name ?? null,
      actor_avatar_url: notification.actor_avatar_url ?? null,
      action_status: notification.action_status ?? "none",
      metadata: {},
      read_at: notification.unread ? null : createdAt,
      created_at: createdAt,
    };
  });

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw error;
}
