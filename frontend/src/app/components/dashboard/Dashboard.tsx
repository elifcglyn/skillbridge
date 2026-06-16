import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Users, MessageSquare, Calendar, Bell, Star, BarChart2,
  Settings, LogOut, Sun, Moon, Menu, Home,
  Zap, Search, Sparkles
} from "lucide-react";
import { supabase } from '@/lib/supabase'; // Supabase bağlantısı
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

// Rozet (badge) değerlerini dinamik vereceğimiz için buradan sildik
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
  
  // Supabase'den çekilecek dinamik kullanıcı verileri
  const [userName, setUserName] = useState("Öğrenci");
  const [userSchoolInfo, setUserSchoolInfo] = useState("Üniversite Öğrencisi");

  // CANLI ROZET SAYILARI İÇİN STATE
  const [badgeCounts, setBadgeCounts] = useState({
    matches: 0,
    messages: 0,
    notifications: 0
  });

  // 1. Profil Bilgilerini Çekme
  useEffect(() => {
    async function fetchActiveUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.user_metadata) {
        const firstName = user.user_metadata.first_name || "";
        const lastName = user.user_metadata.last_name || "";
        if (firstName) setUserName(`${firstName} ${lastName}`.trim());

        const university = user.user_metadata.university || "";
        const department = user.user_metadata.department || "";
        if (university) {
          setUserSchoolInfo(`${university} ${department ? `· ${department}` : ''}`);
        }
      }
    }
    fetchActiveUser();
  }, []);

  // 2. Canlı Sayıları Çekme ve Realtime Dinleme (Yeni Eklenen Kısım)
  useEffect(() => {
    async function fetchCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const myId = user.id;

      // Bekleyen Eşleşme İstekleri
      const { count: matchCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', myId)
        .eq('status', 'pending');

      // Okunmamış Mesajlar
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', myId)
        .eq('is_read', false);

      // Okunmamış Bildirimler
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', myId)
        .eq('is_read', false);

      setBadgeCounts({
        matches: matchCount || 0,
        messages: msgCount || 0,
        notifications: notifCount || 0
      });
    }

    fetchCounts();

    // Veritabanında bir değişiklik olduğunda (mesaj gelmesi vb.) sayıları otomatik yenile
    const channel = supabase.channel('sidebar_badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate("landing"); 
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
      case "notifications": return <div className="p-10 flex justify-center text-muted-foreground">Bildirim altyapısı API'ye bağlanıyor...</div>;
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
              // Hangi menüde hangi sayının görüneceğini belirliyoruz
              let currentBadge = 0;
              if (item.id === "matches") currentBadge = badgeCounts.matches;
              if (item.id === "messages") currentBadge = badgeCounts.messages;
              if (item.id === "notifications") currentBadge = badgeCounts.notifications;

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
                  
                  {/* Sayı 0'dan büyükse rozeti göster */}
                  {currentBadge > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${activeView === item.id ? "bg-white/20 text-white" : "bg-primary/20 text-primary"}`}>
                      {currentBadge}
                    </span>
                  )}
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
          
          <button onClick={() => setActiveView("notifications")} className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
            <Bell size={18} className="text-muted-foreground" />
            {/* Eğer okunmamış bildirim varsa kırmızı noktayı göster */}
            {badgeCounts.notifications > 0 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          
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