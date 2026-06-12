import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  MessageSquare,
  Calendar,
  Award,
  Zap,
  Star,
  Bell,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  NotificationActionStatus,
  NotificationType,
  SkillBridgeNotification,
} from "@/lib/notifications";

interface NotificationsViewProps {
  notifications: SkillBridgeNotification[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  unreadCount: number;
  onRefresh: () => void;
  onMarkRead: (notificationId: string) => Promise<void> | void;
  onMarkAllRead: () => Promise<void> | void;
  onDismiss: (notificationId: string) => Promise<void> | void;
  onActionStatusChange: (
    notificationId: string,
    actionStatus: Extract<NotificationActionStatus, "accepted" | "declined">
  ) => Promise<void> | void;
}

type FilterId = "all" | "matches" | "messages" | "achievements" | "sessions";

const FILTERS: { id: FilterId; label: string; types?: NotificationType[] }[] = [
  { id: "all", label: "All" },
  { id: "matches", label: "Matches", types: ["match"] },
  { id: "messages", label: "Messages", types: ["message"] },
  { id: "achievements", label: "Achievements", types: ["achievement", "points", "review"] },
  { id: "sessions", label: "Sessions", types: ["session"] },
];

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  match: { icon: Users, color: "#4338ca" },
  message: { icon: MessageSquare, color: "#7c3aed" },
  session: { icon: Calendar, color: "#06b6d4" },
  achievement: { icon: Award, color: "#f59e0b" },
  points: { icon: Zap, color: "#10b981" },
  review: { icon: Star, color: "#ec4899" },
  suggestion: { icon: Bell, color: "#6366f1" },
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelativeTime(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const elapsed = Date.now() - createdTime;

  if (!Number.isFinite(createdTime) || elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(createdAt));
}

export function NotificationsView({
  notifications,
  loading,
  error,
  isAuthenticated,
  unreadCount,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onActionStatusChange,
}: NotificationsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [workingNotificationId, setWorkingNotificationId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    const activeFilterConfig = FILTERS.find(filter => filter.id === activeFilter);

    if (!activeFilterConfig?.types) return notifications;
    return notifications.filter(notification => activeFilterConfig.types?.includes(notification.type));
  }, [activeFilter, notifications]);

  const unreadLabel = unreadCount === 1 ? "1 unread notification" : `${unreadCount} unread notifications`;

  const runNotificationAction = async (notificationId: string, action: () => Promise<void> | void) => {
    setWorkingNotificationId(notificationId);

    try {
      await action();
    } finally {
      setWorkingNotificationId(null);
    }
  };

  const renderStateMessage = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded-lg w-32" />
                <div className="h-4 bg-muted rounded-lg w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="p-6 rounded-2xl border border-border bg-card text-center">
          <Bell size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Sign in to see notifications</p>
          <p className="text-sm text-muted-foreground mt-1">Your SkillBridge updates will appear here.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <p className="text-sm font-semibold text-foreground">Notifications could not be loaded.</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-sm text-primary font-medium hover:underline">
            Try again
          </button>
        </div>
      );
    }

    if (filteredNotifications.length === 0) {
      return (
        <div className="p-6 rounded-2xl border border-border bg-card text-center">
          <Bell size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No notifications here</p>
          <p className="text-sm text-muted-foreground mt-1">New updates will show up in this list.</p>
        </div>
      );
    }

    return null;
  };

  const stateMessage = renderStateMessage();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">{unreadLabel}</p>
        </div>
        <button
          type="button"
          disabled={!isAuthenticated || loading || unreadCount === 0 || workingNotificationId === "all"}
          onClick={() => runNotificationAction("all", onMarkAllRead)}
          className="text-sm text-primary font-medium hover:underline disabled:opacity-40 disabled:pointer-events-none">
          Mark all read
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === filter.id ? "text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            style={activeFilter === filter.id ? { background: "var(--sb-gradient)" } : {}}>
            {filter.label}
          </button>
        ))}
      </div>

      {stateMessage ? (
        stateMessage
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification, index) => {
            const config = NOTIFICATION_CONFIG[notification.type];
            const NotificationIcon = config.icon;
            const isUnread = !notification.read_at;
            const isWorking = workingNotificationId === notification.id;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer group ${
                  isUnread ? "border-primary/15 bg-primary/3" : "border-border bg-card"
                }`}>
                <div className="relative flex-shrink-0">
                  {notification.actor_avatar_url ? (
                    <img
                      src={notification.actor_avatar_url}
                      alt={notification.actor_name ?? ""}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${config.color}14` }}>
                      <NotificationIcon size={20} style={{ color: config.color }} />
                    </div>
                  )}
                  {isUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card" style={{ background: config.color }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-foreground">{notification.title}</span>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notification.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(notification.created_at)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={event => {
                            event.stopPropagation();
                            runNotificationAction(notification.id, () => onMarkRead(notification.id));
                          }}
                          className="p-1 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-40">
                          <Check size={11} />
                        </button>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={event => {
                            event.stopPropagation();
                            runNotificationAction(notification.id, () => onDismiss(notification.id));
                          }}
                          className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-40">
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {notification.type === "match" && notification.action_status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={event => {
                          event.stopPropagation();
                          runNotificationAction(notification.id, () => onActionStatusChange(notification.id, "accepted"));
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                        style={{ background: "var(--sb-gradient)" }}>
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={event => {
                          event.stopPropagation();
                          runNotificationAction(notification.id, () => onActionStatusChange(notification.id, "declined"));
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
