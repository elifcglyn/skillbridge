import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Users, MessageSquare, Calendar, Bell, Star, BarChart2,
  Settings, LogOut, Sun, Moon, Menu, Home,
  Zap, Search, Sparkles, Award
} from "lucide-react";
import { supabase } from '@/lib/supabase'; // Supabase bağlantısı
import {
  dismissNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  seedDevNotificationsIfNeeded,
  updateNotificationActionStatus,
  type NotificationActionStatus,
  type NotificationType,
  type SkillBridgeNotification,
} from "@/lib/notifications";
import { ProfileView } from "./views/ProfileView";
import { MatchesView } from "./views/MatchesView";
import { MessagesView } from "./views/MessagesView";
import { CalendarView } from "./views/CalendarView";
import { NotificationsView } from "./views/NotificationsView";
import { FeedbackView } from "./views/FeedbackView";
import { SkillProgressView } from "./views/SkillProgressView";
import { HomeView } from "./views/HomeView";
import { FindMatchView } from "./views/FindMatchView";
interface DashboardProps {
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Ana Sayfa" },
  { id: "profile", icon: User, label: "Profilim" },
  { id: "findmatch", icon: Sparkles, label: "Eşleşme Bul" },
  { id: "matches", icon: Users, label: "Eşleşmeler", badge: 3 },
  { id: "messages", icon: MessageSquare, label: "Mesajlar", badge: 5 },
  { id: "calendar", icon: Calendar, label: "Takvim" },
  { id: "notifications", icon: Bell, label: "Bildirimler" },
  { id: "feedback", icon: Star, label: "Geri Bildirim" },
  { id: "progress", icon: BarChart2, label: "Gelişimim" },
];

const NOTIFICATION_PREVIEW_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string }> = {
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

function formatNotificationPreviewTime(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const elapsed = Date.now() - createdTime;

  if (!Number.isFinite(createdTime) || elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(createdAt));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const supabaseError = error as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [supabaseError.message, supabaseError.details, supabaseError.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);

    if (parts.length > 0) return parts.join(" ");
  }

  return "Bildirimler yüklenirken bir hata oluştu.";
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [activeView, setActiveView] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  
  // Supabase'den çekilecek dinamik kullanıcı verileri
  const [userName, setUserName] = useState("Öğrenci");
  const [userSchoolInfo, setUserSchoolInfo] = useState("Üniversite Öğrencisi");
  const [notificationUserId, setNotificationUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SkillBridgeNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const unreadNotificationsCount = notifications.filter(notification => !notification.read_at).length;
  const visibleNotificationsCount = notifications.length;
  const recentNotifications = notifications.slice(0, 4);

  const loadUserNotifications = useCallback(async (userId: string) => {
    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      await seedDevNotificationsIfNeeded(userId);
      const nextNotifications = await listNotifications(userId);
      setNotifications(nextNotifications);
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchActiveUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotificationUserId(null);
        setNotifications([]);
        setNotificationsLoading(false);
        setNotificationsError(null);
        return;
      }

      setNotificationUserId(user.id);
      await loadUserNotifications(user.id);

      if (user && user.user_metadata) {
        // İsim Çekme
        const firstName = user.user_metadata.first_name || "";
        const lastName = user.user_metadata.last_name || "";
        if (firstName) setUserName(`${firstName} ${lastName}`.trim());

        // Okul/Bölüm Çekme
        const university = user.user_metadata.university || "";
        const department = user.user_metadata.department || "";
        if (university) {
          setUserSchoolInfo(`${university} ${department ? `· ${department}` : ''}`);
        }
      }
    }
    fetchActiveUser();
  }, [loadUserNotifications]);

  useEffect(() => {
    if (!notificationsMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationsMenuRef.current?.contains(event.target as Node)) {
        setNotificationsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [notificationsMenuOpen]);

  const replaceNotification = (updatedNotification: SkillBridgeNotification) => {
    setNotifications(currentNotifications =>
      currentNotifications.map(notification =>
        notification.id === updatedNotification.id ? updatedNotification : notification
      )
    );
  };

  const handleNotificationRead = async (notificationId: string) => {
    try {
      const updatedNotification = await markNotificationRead(notificationId);
      replaceNotification(updatedNotification);
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
    }
  };

  const handleAllNotificationsRead = async () => {
    if (!notificationUserId) return;

    try {
      const readAt = new Date().toISOString();
      await markAllNotificationsRead(notificationUserId);
      setNotifications(currentNotifications =>
        currentNotifications.map(notification => ({
          ...notification,
          read_at: notification.read_at ?? readAt,
        }))
      );
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
    }
  };

  const handleNotificationDismiss = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId);
      setNotifications(currentNotifications =>
        currentNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
    }
  };

  const handleNotificationActionStatus = async (
    notificationId: string,
    actionStatus: Extract<NotificationActionStatus, "accepted" | "declined">
  ) => {
    try {
      const updatedNotification = await updateNotificationActionStatus(notificationId, actionStatus);
      replaceNotification(updatedNotification);
    } catch (error) {
      setNotificationsError(getErrorMessage(error));
    }
  };

  const refreshNotifications = () => {
    if (!notificationUserId) return;
    loadUserNotifications(notificationUserId);
  };

  const openNotificationsPage = () => {
    setActiveView("notifications");
    setNotificationsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate("landing"); // Çıkış yapınca ana sayfaya dön
  };

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const renderView = () => {
    switch (activeView) {
      case "home": return <HomeView onNavigate={setActiveView} />;
      case "profile": return <ProfileView />;
      case "matches": return <MatchesView onNavigate={setActiveView} />;
      case "messages": return <MessagesView />;
      case "calendar": return <CalendarView />;
      case "notifications": return (
        <NotificationsView
          notifications={notifications}
          loading={notificationsLoading}
          error={notificationsError}
          isAuthenticated={Boolean(notificationUserId)}
          unreadCount={unreadNotificationsCount}
          onRefresh={refreshNotifications}
          onMarkRead={handleNotificationRead}
          onMarkAllRead={handleAllNotificationsRead}
          onDismiss={handleNotificationDismiss}
          onActionStatusChange={handleNotificationActionStatus}
        />
      );
      case "feedback": return <FeedbackView />;
      case "progress": return <SkillProgressView />;
      case "findmatch": return <FindMatchView onNavigate={setActiveView} />;
      default: return <HomeView onNavigate={setActiveView} />;
    }
  };

  const activeItem = NAV_ITEMS.find(n => n.id === activeView);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobil Karartma Ekranı */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* YAN MENÜ (SIDEBAR) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto flex flex-col w-64 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "var(--sidebar)" }}>
        
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--sb-gradient)" }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path d="M4 11 C4 7.5 7 5 11 5 C15 5 18 7.5 18 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M4 11 C4 14.5 7 17 11 17 C15 17 18 14.5 18 11" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="4" cy="11" r="2" fill="white" />
              <circle cx="18" cy="11" r="2" fill="white" />
              <circle cx="11" cy="5" r="2" fill="rgba(255,255,255,0.8)" />
              <circle cx="11" cy="17" r="2" fill="rgba(255,255,255,0.8)" />
            </svg>
          </div>
          <span className="font-extrabold text-lg" style={{ color: "var(--sidebar-foreground)" }}>SkillBridge</span>
        </div>

        {/* Öğrenci Kartı (Dinamik) */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: "var(--sidebar-accent)" }}>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md" style={{ background: "var(--sb-gradient)" }}>
                {userName.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2"
                style={{ borderColor: "var(--sidebar-accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: "var(--sidebar-foreground)" }}>{userName}</div>
              <div className="text-xs truncate" style={{ color: "var(--sidebar-accent-foreground)", opacity: 0.6 }}>{userSchoolInfo}</div>
            </div>
          </div>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const itemBadge = item.id === "notifications" ? visibleNotificationsCount : item.badge;

              return (
                <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${activeView === item.id ? "shadow-md" : "hover:opacity-80"}`}
                  style={activeView === item.id
                    ? { background: "var(--sb-gradient)" }
                    : { color: "var(--sidebar-accent-foreground)" }}>
                  <item.icon size={18} style={activeView === item.id ? { color: "white" } : { color: "var(--sidebar-primary)", opacity: 0.7 }} />
                  <span className="flex-1 text-sm font-medium text-left" style={{ color: activeView === item.id ? "white" : "var(--sidebar-foreground)" }}>
                    {item.label}
                  </span>
                  {itemBadge ? (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${activeView === item.id ? "bg-white/20 text-white" : "bg-primary/20 text-primary"}`}>
                      {itemBadge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t space-y-0.5" style={{ borderColor: "var(--sidebar-border)" }}>
            <button onClick={toggleDark}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity">
              {darkMode ? <Sun size={18} style={{ color: "var(--sidebar-primary)", opacity: 0.7 }} /> : <Moon size={18} style={{ color: "var(--sidebar-primary)", opacity: 0.7 }} />}
              <span className="text-sm font-medium" style={{ color: "var(--sidebar-foreground)" }}>{darkMode ? "Açık Tema" : "Koyu Tema"}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity">
              <Settings size={18} style={{ color: "var(--sidebar-primary)", opacity: 0.7 }} />
              <span className="text-sm font-medium" style={{ color: "var(--sidebar-foreground)" }}>Ayarlar</span>
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity">
              <LogOut size={18} style={{ color: "#ef4444", opacity: 0.8 }} />
              <span className="text-sm font-medium text-red-400">Çıkış Yap</span>
            </button>
          </div>
        </nav>

        {/* Puan Aracı */}
        <div className="px-4 py-4">
          <div className="p-3 rounded-2xl border" style={{ background: "rgba(129,140,248,0.1)", borderColor: "var(--sidebar-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} style={{ color: "var(--sb-cyan)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--sidebar-foreground)" }}>Beceri Puanı</span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: "var(--sb-cyan)" }}>2,450</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full w-3/4" style={{ background: "var(--sb-gradient)" }} />
            </div>
            <div className="text-xs mt-1.5 opacity-50" style={{ color: "var(--sidebar-foreground)" }}>Sonraki seviyeye 550 puan</div>
          </div>
        </div>
      </aside>

      {/* ANA İÇERİK (MAIN CONTENT) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Üst Bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-border bg-card">
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="font-extrabold text-foreground">{activeItem?.label || "Ana Sayfa"}</h2>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border w-56">
            <Search size={15} className="text-muted-foreground flex-shrink-0" />
            <input placeholder="Beceri, kişi ara..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0" />
          </div>
          <div className="relative" ref={notificationsMenuRef}>
            <button
              type="button"
              onClick={() => setNotificationsMenuOpen(open => !open)}
              className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
              aria-haspopup="dialog"
              aria-expanded={notificationsMenuOpen}
              aria-label="Bildirimleri aç">
              <Bell size={18} className="text-muted-foreground" />
              {unreadNotificationsCount > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            <AnimatePresence>
              {notificationsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                      <div className="text-sm font-extrabold text-foreground">Bildirimler</div>
                      <div className="text-xs text-muted-foreground">
                        {unreadNotificationsCount} okunmamış bildirim
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!notificationUserId || unreadNotificationsCount === 0}
                      onClick={handleAllNotificationsRead}
                      className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:pointer-events-none">
                      Tümünü oku
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {notificationsLoading ? (
                      <div className="space-y-2 p-2">
                        {[0, 1, 2].map(index => (
                          <div key={index} className="flex gap-3 p-2 rounded-xl animate-pulse">
                            <div className="w-9 h-9 rounded-xl bg-muted" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-muted rounded w-24" />
                              <div className="h-3 bg-muted rounded w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notificationsError ? (
                      <div className="p-3">
                        <div className="text-sm font-semibold text-foreground">Bildirimler yüklenemedi.</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{notificationsError}</div>
                        <button
                          type="button"
                          onClick={refreshNotifications}
                          className="mt-2 text-xs font-medium text-primary hover:underline">
                          Tekrar dene
                        </button>
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-5 text-center">
                        <Bell size={24} className="mx-auto mb-2 text-muted-foreground" />
                        <div className="text-sm font-semibold text-foreground">Bildirim yok</div>
                        <div className="text-xs text-muted-foreground mt-1">Yeni güncellemeler burada görünecek.</div>
                      </div>
                    ) : (
                      recentNotifications.map(notification => {
                        const config = NOTIFICATION_PREVIEW_CONFIG[notification.type];
                        const PreviewIcon = config.icon;
                        const isUnread = !notification.read_at;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={openNotificationsPage}
                            className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors hover:bg-muted ${
                              isUnread ? "bg-primary/5" : ""
                            }`}>
                            <div className="relative flex-shrink-0">
                              {notification.actor_avatar_url ? (
                                <img
                                  src={notification.actor_avatar_url}
                                  alt={notification.actor_name ?? ""}
                                  className="w-9 h-9 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.color}14` }}>
                                  <PreviewIcon size={17} style={{ color: config.color }} />
                                </div>
                              )}
                              {isUnread && (
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ background: config.color }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-foreground truncate">{notification.title}</div>
                                <div className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                                  {formatNotificationPreviewTime(notification.created_at)}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.description}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="px-3 py-2 border-t border-border bg-muted/30">
                    <button
                      type="button"
                      onClick={openNotificationsPage}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: "var(--sb-gradient)" }}>
                      Tüm bildirimleri gör
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Üst bar profil resmi yerine dinamik baş harf */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white cursor-pointer border-2 border-primary/30" style={{ background: "var(--sb-gradient)" }}>
             {userName.charAt(0)}
          </div>
        </header>

        {/* Görünüm İçeriği */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full">
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
