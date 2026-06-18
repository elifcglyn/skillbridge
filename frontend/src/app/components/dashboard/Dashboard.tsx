import { useEffect, useRef, useState } from "react";
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
  Video,
  Zap,
  Gift, // EKLENDİ
  Coins // EKLENDİ
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  type SkillBridgeSession,
} from "@/lib/sessions";
import {
  getHomeDashboard,
  searchHomeDirectory,
  type HomeDashboardData,
  type HomeSearchResult,
} from "@/lib/homeDashboard";
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
import { SessionsView } from "./views/SessionsView";
import { SettingsView } from "./views/SettingsView";
import { RewardsView } from "./views/RewardsView"; // EKLENDİ

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
  { id: "sessions", icon: Video, label: "Görüşmeler" },
  { id: "rewards", icon: Gift, label: "Ödül & Market" }, // MENÜYE EKLENDİ
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
  const [messagePeerId, setMessagePeerId] = useState<string | null>(null);
  const [calendarPeerId, setCalendarPeerId] = useState<string | null>(null);
  const [calendarSession, setCalendarSession] = useState<SkillBridgeSession | null>(null);
  const [sessionTargetId, setSessionTargetId] = useState<string | null>(null);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SkillBridgeNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<HomeDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState<HomeSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const dashboardRefreshTimer = useRef<number | null>(null);

  const badgeCounts = {
    matches: dashboardData?.sidebar.matchCount ?? 0,
    messages: dashboardData?.sidebar.messageCount ?? 0,
    sessions: dashboardData?.sidebar.sessionCount ?? 0,
    notifications: dashboardData?.sidebar.notificationCount ?? 0,
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const data = await getHomeDashboard();
      setDashboardData(data);
      setUserName(data.user.fullName || "Öğrenci");
      setUserSchoolInfo(data.user.schoolInfo || "Üniversite Öğrencisi");
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Dashboard verileri yüklenemedi.",
      );
    } finally {
      setDashboardLoading(false);
    }
  };

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

  const handleMessagesRead = async () => {
    if (currentUserId) await loadDashboard();
  };

  const openMessages = (peerId: string) => {
    setCalendarPeerId(null);
    setCalendarSession(null);
    setMessagePeerId(peerId);
    setActiveView("messages");
  };

  const openCalendar = (peerId: string) => {
    setMessagePeerId(null);
    setCalendarPeerId(peerId);
    setCalendarSession(null);
    setActiveView("calendar");
  };

  const openCalendarSession = (session?: SkillBridgeSession | null) => {
    setMessagePeerId(null);
    setCalendarPeerId(session?.peer.id ?? null);
    setCalendarSession(session ?? null);
    setActiveView("calendar");
  };

  const openSessions = (sessionId?: string | null) => {
    setSessionTargetId(sessionId ?? null);
    setActiveView("sessions");
  };

  const openFeedback = (session: SkillBridgeSession) => {
    setFeedbackSessionId(session.id);
    setActiveView("feedback");
  };

  useEffect(() => {
    let mounted = true;

    async function initDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      setCurrentUserId(user?.id ?? null);
      if (!user) return;

      await Promise.all([loadDashboard(), loadNotifications(user.id)]);
    }

    initDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const refresh = () => {
      if (dashboardRefreshTimer.current) {
        window.clearTimeout(dashboardRefreshTimer.current);
      }
      dashboardRefreshTimer.current = window.setTimeout(() => {
        loadDashboard();
      }, 250);
    };
    const refreshNotifications = () => {
      refresh();
      loadNotifications(currentUserId);
    };

    const channel = supabase
      .channel("sidebar_badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_skills" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "learning_activity" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "point_events" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_achievements" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refreshNotifications)
      .subscribe();

    return () => {
      if (dashboardRefreshTimer.current) {
        window.clearTimeout(dashboardRefreshTimer.current);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    const query = globalSearch.trim();
    if (!currentUserId || query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      setSearchError(null);
      searchHomeDirectory(query)
        .then((results) => {
          if (active) setSearchResults(results);
        })
        .catch((error) => {
          if (active) {
            setSearchResults([]);
            setSearchError(
              error instanceof Error ? error.message : "Arama yapılamadı.",
            );
          }
        })
        .finally(() => {
          if (active) setSearchLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentUserId, globalSearch]);

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
    if (currentUserId) await loadDashboard();
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUserId) return;
    await markAllNotificationsRead(currentUserId);
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    await loadDashboard();
  };

  const handleDismissNotification = async (notificationId: string) => {
    await dismissNotification(notificationId);
    setNotifications((items) => items.filter((item) => item.id !== notificationId));
    if (currentUserId) await loadDashboard();
  };

  const handleNotificationActionStatus = async (
    notificationId: string,
    actionStatus: Extract<NotificationActionStatus, "accepted" | "declined">,
  ) => {
    const updated = await updateNotificationActionStatus(notificationId, actionStatus);
    setNotifications((items) => items.map((item) => (item.id === notificationId ? updated : item)));
    if (currentUserId) await loadDashboard();
  };

  const handleNotificationOpen = async (notification: SkillBridgeNotification) => {
    if (!notification.is_read) {
      await handleMarkNotificationRead(notification.id);
    }

    const peerId =
      typeof notification.metadata.peerId === "string"
        ? notification.metadata.peerId
        : null;

    if (notification.type === "MESSAGE" && peerId) {
      openMessages(peerId);
      return;
    }
    if (notification.type === "SESSION") {
      const sessionId =
        typeof notification.metadata.sessionId === "string"
          ? notification.metadata.sessionId
          : null;
      openSessions(sessionId);
      return;
    }
    if (notification.type === "MATCH") {
      setActiveView("matches");
      return;
    }

    const target = notification.related_url?.replace(/^\/+/, "");
    if (target && NAV_ITEMS.some((item) => item.id === target)) {
      setActiveView(target);
    }
  };

  const handleSearchResult = (result: HomeSearchResult) => {
    setGlobalSearch("");
    setSearchResults([]);
    setSearchOpen(false);

    if (result.type === "profile" && result.action === "messages") {
      openMessages(result.id);
      return;
    }

    setActiveView("findmatch");
  };

  // SAYFA RENDER SİSTEMİ
  const renderView = () => {
    switch (activeView) {
      case "home":
        return (
          <HomeView
            onNavigate={setActiveView}
            onOpenSession={openSessions}
            onOpenMessages={openMessages}
            onOpenCalendar={openCalendar}
            dashboardData={dashboardData}
            loading={dashboardLoading}
            error={dashboardError}
            onRefresh={loadDashboard}
          />
        );
      case "profile":
        return <ProfileView />;
      case "matches":
        return (
          <MatchesView
            onNavigate={setActiveView}
            onOpenMessages={openMessages}
            onOpenCalendar={openCalendar}
          />
        );
      case "messages":
        return (
          <MessagesView
            initialPeerId={messagePeerId}
            onMessagesRead={handleMessagesRead}
          />
        );
      case "calendar":
        return (
          <CalendarView
            initialPeerId={calendarPeerId}
            initialSession={calendarSession}
            onOpenSession={openSessions}
          />
        );
      case "sessions":
        return (
          <SessionsView
            initialSessionId={sessionTargetId}
            onOpenCalendar={openCalendarSession}
            onOpenFeedback={openFeedback}
          />
        );
      case "settings":
        return <SettingsView />;
      case "rewards": // ÖDÜLLER SAYFASI YÖNLENDİRMESİ
        return <RewardsView onBalanceChange={loadDashboard} />;
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
        return (
          <FindMatchView
            onNavigate={setActiveView}
            onOpenMessages={openMessages}
            onOpenCalendar={openCalendar}
          />
        );
      default:
        return (
          <HomeView
            onNavigate={setActiveView}
            onOpenSession={openSessions}
            onOpenMessages={openMessages}
            onOpenCalendar={openCalendar}
            dashboardData={dashboardData}
            loading={dashboardLoading}
            error={dashboardError}
            onRefresh={loadDashboard}
          />
        );
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
              if (item.id === "sessions") currentBadge = badgeCounts.sessions;
              if (item.id === "notifications") currentBadge = badgeCounts.notifications;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMessagePeerId(null);
                    setCalendarPeerId(null);
                    setCalendarSession(null);
                    setSessionTargetId(null);
                    setFeedbackSessionId(null);
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
            
            <button 
              onClick={() => {
                setMessagePeerId(null);
                setCalendarPeerId(null);
                setCalendarSession(null);
                setSessionTargetId(null);
                setFeedbackSessionId(null);
                setActiveView("settings");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeView === "settings" ? "shadow-md" : "hover:opacity-80"
              }`}
              style={activeView === "settings"
                ? { background: "var(--sb-gradient)" }
                : { color: "var(--sidebar-accent-foreground)" }}
            >
              <Settings size={18} style={{ color: activeView === "settings" ? "white" : "var(--sidebar-primary)" }} />
              <span className="text-sm font-medium text-left" style={{ color: activeView === "settings" ? "white" : "var(--sidebar-foreground)" }}>
                Ayarlar
              </span>
            </button>
            
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80">
              <LogOut size={18} className="text-red-400" />
              <span className="text-sm font-medium text-red-400">Çıkış Yap</span>
            </button>
          </div>
        </nav>

        {/* SKILLCOIN VE SEVİYE PUANI */}
        <div className="px-4 py-4">
          <div className="p-3 rounded-2xl border" style={{ background: "rgba(129,140,248,0.1)", borderColor: "var(--sidebar-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Coins size={14} style={{ color: "var(--sb-cyan)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--sidebar-foreground)" }}>Seviye Puanı</span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: "var(--sb-cyan)" }}>
                {dashboardData?.sidebar.skillPoints.toLocaleString("tr-TR") ?? "0"}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${dashboardData?.sidebar.skillPointProgress ?? 0}%`,
                  background: "var(--sb-gradient)",
                }}
              />
            </div>
            <div className="mt-1.5 text-[10px] opacity-60" style={{ color: "var(--sidebar-foreground)" }}>
              Sonraki seviyeye {dashboardData?.sidebar.pointsToNextLevel ?? 0} puan
            </div>
            <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--sidebar-border)" }}>
              <span className="text-[10px] font-semibold" style={{ color: "var(--sidebar-foreground)" }}>
                SkillCoin bakiyesi
              </span>
              <span className="text-xs font-extrabold" style={{ color: "var(--sb-cyan)" }}>
                {dashboardData?.sidebar.coinBalance.toLocaleString("tr-TR") ?? "0"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-border bg-card">
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="font-extrabold text-foreground">
            {activeView === "settings" ? "Ayarlar" : activeView === "rewards" ? "Ödül & Market" : activeItem?.label || "Ana Sayfa"}
          </h2>
          <div className="flex-1" />
          <div className="relative hidden sm:block w-64">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
              <Search size={15} className="text-muted-foreground flex-shrink-0" />
              <input
                value={globalSearch}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                onChange={(event) => {
                  setGlobalSearch(event.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Beceri, kişi ara..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
              />
            </div>
            {searchOpen && globalSearch.trim().length >= 2 && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl z-50 p-2">
                {searchLoading ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Aranıyor...
                  </div>
                ) : searchError ? (
                  <div className="p-4 text-sm text-red-600">{searchError}</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Sonuç bulunamadı.
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSearchResult(result)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-muted transition-colors">
                      {result.avatarUrl ? (
                        <img
                          src={result.avatarUrl}
                          alt={result.title}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ background: "var(--sb-gradient)" }}>
                          {result.title.charAt(0).toLocaleUpperCase("tr-TR")}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {result.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-primary">
                        {result.action === "messages" ? "Mesaj" : "Eşleş"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
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
