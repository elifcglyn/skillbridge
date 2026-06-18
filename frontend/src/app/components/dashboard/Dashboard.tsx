import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart2,
  Bell,
  Calendar,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  User,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  dismissNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationActionStatus,
  type NotificationActionStatus,
  type SkillBridgeNotification,
} from "@/lib/notifications";
import { CalendarView } from "./views/CalendarView";
import { FeedbackView } from "./views/FeedbackView";
import { FindMatchView } from "./views/FindMatchView";
import { HomeView } from "./views/HomeView";
import { MatchesView } from "./views/MatchesView";
import { MessagesView } from "./views/MessagesView";
import { NotificationsView } from "./views/NotificationsView";
import { ProfileView } from "./views/ProfileView";
import { SkillProgressView } from "./views/SkillProgressView";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Ana Sayfa" },
  { id: "profile", icon: User, label: "Profilim" },
  { id: "findmatch", icon: Sparkles, label: "Eşleşme Bul" },
  { id: "matches", icon: Users, label: "Eşleşmeler" },
  { id: "messages", icon: MessageSquare, label: "Mesajlar" },
  { id: "calendar", icon: Calendar, label: "Takvim" },
  { id: "notifications", icon: Bell, label: "Bildirimler" },
  { id: "feedback", icon: Star, label: "Geri Bildirim" },
  { id: "progress", icon: BarChart2, label: "Gelişimim" },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const [activeView, setActiveView] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Öğrenci");
  const [userSchoolInfo, setUserSchoolInfo] = useState("Üniversite Öğrencisi");
  const [notifications, setNotifications] = useState<SkillBridgeNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [badgeCounts, setBadgeCounts] = useState({
    matches: 0,
    messages: 0,
    notifications: 0,
  });

  const loadNotifications = async (userId: string) => {
    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      setNotifications(await listNotifications(userId));
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Bildirimler yüklenemedi.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const refreshCounts = async (userId: string) => {
    const messageCountQuery = supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .or("is_read.eq.false,is_read.is.null");

    const [{ count: matchCount }, { count: msgCount }, { count: notifCount }] = await Promise.all([
      supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("status", "pending"),
      messageCountQuery,
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .is("dismissed_at", null),
    ]);

    setBadgeCounts({
      matches: matchCount || 0,
      messages: msgCount || 0,
      notifications: notifCount || 0,
    });
  };

  const handleMessagesRead = async () => {
    if (currentUserId) {
      await refreshCounts(currentUserId);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      setCurrentUserId(user?.id ?? null);
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,first_name,last_name,university,department")
        .eq("id", user.id)
        .maybeSingle();

      const metadata = user.user_metadata ?? {};
      const firstName = profile?.first_name || metadata.first_name || "";
      const lastName = profile?.last_name || metadata.last_name || "";
      const fullName = profile?.full_name || [firstName, lastName].filter(Boolean).join(" ").trim();
      const university = profile?.university || metadata.university || "";
      const department = profile?.department || metadata.department || "";

      if (fullName) setUserName(fullName);
      if (university) setUserSchoolInfo(`${university}${department ? ` · ${department}` : ""}`);

      await Promise.all([refreshCounts(user.id), loadNotifications(user.id)]);
    }

    initDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const refresh = () => {
      refreshCounts(currentUserId);
      loadNotifications(currentUserId);
    };

    const channel = supabase
      .channel("sidebar_badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const unreadNotificationCount = notifications.filter((notification) => !notification.is_read).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate("landing");
  };

  const toggleDark = () => {
    setDarkMode((value) => !value);
    document.documentElement.classList.toggle("dark");
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const updated = await markNotificationRead(notificationId);
    setNotifications((items) => items.map((item) => (item.id === notificationId ? updated : item)));
    if (currentUserId) await refreshCounts(currentUserId);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUserId) return;
    await markAllNotificationsRead(currentUserId);
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    await refreshCounts(currentUserId);
  };

  const handleDismissNotification = async (notificationId: string) => {
    await dismissNotification(notificationId);
    setNotifications((items) => items.filter((item) => item.id !== notificationId));
    if (currentUserId) await refreshCounts(currentUserId);
  };

  const handleNotificationActionStatus = async (
    notificationId: string,
    actionStatus: Extract<NotificationActionStatus, "accepted" | "declined">,
  ) => {
    const updated = await updateNotificationActionStatus(notificationId, actionStatus);
    setNotifications((items) => items.map((item) => (item.id === notificationId ? updated : item)));
  };

  const handleNotificationOpen = async (notification: SkillBridgeNotification) => {
    if (!notification.is_read) {
      await handleMarkNotificationRead(notification.id);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "home":
        return <HomeView onNavigate={setActiveView} />;
      case "profile":
        return <ProfileView />;
      case "matches":
        return <MatchesView onNavigate={setActiveView} />;
      case "messages":
        return <MessagesView onMessagesRead={handleMessagesRead} />;
      case "calendar":
        return <CalendarView />;
      case "notifications":
        return (
          <NotificationsView
            notifications={notifications}
            loading={notificationsLoading}
            error={notificationsError}
            isAuthenticated={Boolean(currentUserId)}
            unreadCount={unreadNotificationCount}
            onRefresh={() => currentUserId && loadNotifications(currentUserId)}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onDismiss={handleDismissNotification}
            onActionStatusChange={handleNotificationActionStatus}
            onNotificationOpen={handleNotificationOpen}
          />
        );
      case "feedback":
        return <FeedbackView />;
      case "progress":
        return <SkillProgressView />;
      case "findmatch":
        return <FindMatchView onNavigate={setActiveView} />;
      default:
        return <HomeView onNavigate={setActiveView} />;
    }
  };

  const activeItem = NAV_ITEMS.find((item) => item.id === activeView);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto flex flex-col w-64 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "var(--sidebar)" }}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--sb-gradient)" }}>
            <Sparkles size={19} className="text-white" />
          </div>
          <span className="font-extrabold text-lg" style={{ color: "var(--sidebar-foreground)" }}>SkillBridge</span>
        </div>

        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--sidebar-accent)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white" style={{ background: "var(--sb-gradient)" }}>
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: "var(--sidebar-foreground)" }}>{userName}</div>
              <div className="text-xs truncate opacity-60" style={{ color: "var(--sidebar-accent-foreground)" }}>{userSchoolInfo}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              let currentBadge = 0;
              if (item.id === "matches") currentBadge = badgeCounts.matches;
              if (item.id === "messages") currentBadge = badgeCounts.messages;
              if (item.id === "notifications") currentBadge = badgeCounts.notifications;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeView === item.id ? "shadow-md" : "hover:opacity-80"
                  }`}
                  style={activeView === item.id
                    ? { background: "var(--sb-gradient)" }
                    : { color: "var(--sidebar-accent-foreground)" }}>
                  <item.icon size={18} style={{ color: activeView === item.id ? "white" : "var(--sidebar-primary)" }} />
                  <span className="flex-1 text-sm font-medium text-left" style={{ color: activeView === item.id ? "white" : "var(--sidebar-foreground)" }}>
                    {item.label}
                  </span>
                  {currentBadge > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                      activeView === item.id ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
                    }`}>
                      {currentBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t space-y-0.5" style={{ borderColor: "var(--sidebar-border)" }}>
            <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm font-medium" style={{ color: "var(--sidebar-foreground)" }}>
                {darkMode ? "Açık Tema" : "Koyu Tema"}
              </span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80">
              <Settings size={18} />
              <span className="text-sm font-medium" style={{ color: "var(--sidebar-foreground)" }}>Ayarlar</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80">
              <LogOut size={18} className="text-red-400" />
              <span className="text-sm font-medium text-red-400">Çıkış Yap</span>
            </button>
          </div>
        </nav>

        <div className="px-4 py-4">
          <div className="p-3 rounded-2xl border" style={{ background: "rgba(129,140,248,0.1)", borderColor: "var(--sidebar-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} style={{ color: "var(--sb-cyan)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--sidebar-foreground)" }}>Beceri Puanı</span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: "var(--sb-cyan)" }}>Canlı</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full w-2/3" style={{ background: "var(--sb-gradient)" }} />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-border bg-card">
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="font-extrabold text-foreground">{activeItem?.label || "Ana Sayfa"}</h2>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border w-56">
            <Search size={15} className="text-muted-foreground flex-shrink-0" />
            <input placeholder="Beceri, kişi ara..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0" />
          </div>
          <button onClick={() => setActiveView("notifications")} className="relative p-2.5 rounded-xl hover:bg-muted">
            <Bell size={18} className="text-muted-foreground" />
            {badgeCounts.notifications > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />}
          </button>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white border-2 border-primary/30" style={{ background: "var(--sb-gradient)" }}>
            {userName.charAt(0)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
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
