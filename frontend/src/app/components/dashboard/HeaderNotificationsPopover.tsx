import { useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  MessageSquare,
  RefreshCw,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  NotificationType,
  SkillBridgeNotification,
} from "@/lib/notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { ScrollArea } from "@/app/components/ui/scroll-area";

type HeaderNotificationsPopoverProps = {
  notifications: SkillBridgeNotification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  onRefresh: () => Promise<void> | void;
  onMarkRead: (notificationId: string) => Promise<void> | void;
  onMarkAllRead: () => Promise<void> | void;
  onNotificationOpen: (
    notification: SkillBridgeNotification,
  ) => Promise<void> | void;
  onViewAll: () => void;
};

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: LucideIcon; color: string }
> = {
  MATCH: { icon: Users, color: "#4338ca" },
  MESSAGE: { icon: MessageSquare, color: "#7c3aed" },
  SESSION: { icon: Calendar, color: "#06b6d4" },
  FEEDBACK: { icon: Star, color: "#ec4899" },
  SYSTEM: { icon: Bell, color: "#6366f1" },
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelativeTime(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const elapsed = Date.now() - createdTime;

  if (!Number.isFinite(createdTime) || elapsed < MINUTE) return "şimdi";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} dk`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} sa`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)} gün`;

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(createdAt));
}

export function HeaderNotificationsPopover({
  notifications,
  loading,
  error,
  unreadCount,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onNotificationOpen,
  onViewAll,
}: HeaderNotificationsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (
    id: string,
    action: () => Promise<void> | void,
  ) => {
    setWorkingId(id);
    setActionError(null);
    try {
      await action();
    } catch (actionFailure) {
      setActionError(
        actionFailure instanceof Error
          ? actionFailure.message
          : "Bildirim işlemi tamamlanamadı.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) void onRefresh();
  };

  const handleNotificationOpen = async (
    notification: SkillBridgeNotification,
  ) => {
    await runAction(notification.id, async () => {
      await onNotificationOpen(notification);
      setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount
              ? `Bildirimler, ${unreadCount} okunmamış`
              : "Bildirimler"
          }
          className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
        >
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] leading-4 font-bold text-white text-center ring-2 ring-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-2rem))] p-0 rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground">Bildirimler</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount
                ? `${unreadCount} okunmamış bildirim`
                : "Tüm bildirimler okundu"}
            </p>
          </div>
          <button
            type="button"
            disabled={unreadCount === 0 || workingId === "all"}
            onClick={() => void runAction("all", onMarkAllRead)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-40 disabled:pointer-events-none"
          >
            <CheckCheck size={14} />
            Tümünü oku
          </button>
        </div>

        {actionError && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-red-500/10 text-xs text-red-600">
            {actionError}
          </div>
        )}

        <ScrollArea className="h-[min(25rem,60vh)]">
          {loading ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 p-3 rounded-xl animate-pulse"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                Bildirimler yüklenemedi
              </p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void onRefresh()}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-primary"
              >
                <RefreshCw size={13} /> Tekrar dene
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell
                size={26}
                className="mx-auto text-muted-foreground mb-2"
              />
              <p className="text-sm font-semibold text-foreground">
                Henüz bildiriminiz yok
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Yeni gelişmeler burada görünecek.
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.slice(0, 10).map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                const NotificationIcon = config.icon;
                const isWorking = workingId === notification.id;

                return (
                  <div
                    key={notification.id}
                    className={`group relative flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      notification.is_read
                        ? "hover:bg-muted/60"
                        : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => void handleNotificationOpen(notification)}
                      className="absolute inset-0 rounded-xl disabled:cursor-wait"
                      aria-label={`${notification.title} bildirimini aç`}
                    />

                    <div className="relative z-10 flex-shrink-0 pointer-events-none">
                      {notification.actor_avatar_url ? (
                        <img
                          src={notification.actor_avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${config.color}14` }}
                        >
                          <NotificationIcon
                            size={18}
                            style={{ color: config.color }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={(event) => {
                          event.stopPropagation();
                          void runAction(notification.id, () =>
                            onMarkRead(notification.id),
                          );
                        }}
                        aria-label="Okundu işaretle"
                        title="Okundu işaretle"
                        className="relative z-20 flex-shrink-0 mt-6 p-1.5 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-40"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onViewAll();
          }}
          className="w-full px-4 py-3 border-t border-border text-sm font-semibold text-primary hover:bg-muted/60 transition-colors"
        >
          Tüm bildirimleri görüntüle
        </button>
      </PopoverContent>
    </Popover>
  );
}
