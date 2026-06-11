import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Zap, Users, Star, BookOpen,
  GraduationCap, Calendar, Award, Flame, ChevronRight, MapPin, MessageSquare
} from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { supabase } from '@/lib/supabase';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

const RECENT_MATCHES = [
  { name: "Ayşe Yılmaz", skill: "React Geliştirme", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop", type: "mentor", rating: 4.9, distance: "0.8km", online: true },
  { name: "Caner Türk", skill: "İngilizce Pratik", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop", type: "learner", rating: 4.7, distance: "1.2km", online: false },
  { name: "Zeynep Demir", skill: "UI/UX Tasarım", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop", type: "mentor", rating: 5.0, distance: "2.1km", online: true },
];

const UPCOMING_SESSIONS = [
  { title: "Python Temelleri", mentor: "Aria Chen", time: "Bugün, 15:00", color: "#4338ca", emoji: "🐍" },
  { title: "Figma Atölyesi", mentor: "Zara Ahmed", time: "Yarın, 14:00", color: "#7c3aed", emoji: "🎨" },
  { title: "Kariyer Sohbeti", mentor: "Carlos M.", time: "8 Haz, 11:00", color: "#06b6d4", emoji: "💼" },
];

const learningData = [
  { day: "Pzt", hours: 1.5 }, { day: "Sal", hours: 2.0 }, { day: "Çar", hours: 0.5 },
  { day: "Per", hours: 3.0 }, { day: "Cum", hours: 2.5 }, { day: "Cmt", hours: 4.0 }, { day: "Paz", hours: 1.5 },
];

const skillData = [
  { name: "React", progress: 67, fill: "#4338ca" },
  { name: "İngilizce", progress: 45, fill: "#06b6d4" },
  { name: "Tasarım", progress: 82, fill: "#7c3aed" },
];

const RAW_LEADERBOARD = [
  { rank: 1, name: "Aria Chen", points: 4820, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop", badge: "🏆" },
  { rank: 2, name: "Marcus Rivera", points: 4210, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop", badge: "🥈" },
  { rank: 3, name: "MOCK_KULLANICI", points: 2450, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop", badge: "🥉", isMe: true },
  { rank: 4, name: "Zara Ahmed", points: 2280, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop", badge: "" },
  { rank: 5, name: "Leo Nakamura", points: 1950, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop", badge: "" },
];

export function HomeView({ onNavigate }: HomeViewProps) {
  // Supabase'den çekilecek dinamik kullanıcı adı için state
  const [activeUserName, setActiveUserName] = useState("Öğrenci");

  // Bileşen yüklendiğinde aktif kullanıcının adını getir
  useEffect(() => {
    async function fetchActiveUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.user_metadata) {
        // Kayıt olurken user_metadata'ya yazdığımız first_name'i çekiyoruz
        const firstName = user.user_metadata.first_name;
        if (firstName) {
          setActiveUserName(firstName);
        }
      }
    }
    fetchActiveUser();
  }, []);

  // Liderlik tablosunda "isMe: true" olan satıra dinamik ismimizi basıyoruz
  const LEADERBOARD = RAW_LEADERBOARD.map(user => 
    user.isMe ? { ...user, name: activeUserName } : user
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Karşılama Başlığı */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted-foreground text-sm mb-1">İyi çalışmalar 👋</div>
          <h1 className="text-2xl font-extrabold text-foreground">Tekrar hoş geldin, {activeUserName}!</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-border bg-card">
          <Flame size={16} className="text-orange-500" />
          <span className="text-sm font-bold text-foreground">12 günlük seri</span>
        </div>
      </div>

      {/* İstatistik Satırı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Görüşmeler", value: "24", icon: BookOpen, color: "#4338ca", trend: "Bu hafta +3" },
          { label: "Öğretim Saati", value: "18s", icon: GraduationCap, color: "#7c3aed", trend: "Bugün +2s" },
          { label: "Beceri Puanı", value: "2,450", icon: Zap, color: "#06b6d4", trend: "Bugün +180" },
          { label: "Güven Skoru", value: "9.2", icon: Star, color: "#10b981", trend: "Top %15" },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}14` }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span className="text-xs text-green-500 font-medium">{stat.trend}</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Öğrenme Aktiviteleri Grafiği */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Bu Haftaki Öğrenim</h3>
            <span className="text-xs text-muted-foreground">Toplam: 15s</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={learningData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="hours" stroke="#4338ca" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: "#4338ca", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Beceri İlerlemesi */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Aktif Beceriler</h3>
            <button onClick={() => onNavigate("progress")} className="text-xs text-primary font-medium hover:underline">Tümünü gör</button>
          </div>
          <div className="space-y-4">
            {skillData.map(skill => (
              <div key={skill.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{skill.name}</span>
                  <span className="text-muted-foreground text-xs">{skill.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <motion.div className="h-full rounded-full"
                    style={{ background: skill.fill }}
                    initial={{ width: 0 }} animate={{ width: `${skill.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} className="text-yellow-500" />
              <span className="text-xs font-bold text-foreground">Sıradaki Başarı</span>
            </div>
            <div className="text-xs text-muted-foreground">"Kod Ninjası" rozeti için 5 React görüşmesi daha tamamla</div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-muted">
              <div className="h-full rounded-full bg-yellow-400 w-3/5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yeni Eşleşmeler */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Yeni Eşleşmeler</h3>
            <button onClick={() => onNavigate("matches")} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Tümünü gör <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {RECENT_MATCHES.map((match, i) => (
              <motion.div key={match.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all group">
                <div className="relative flex-shrink-0">
                  <img src={match.avatar} alt={match.name} className="w-11 h-11 rounded-xl object-cover" />
                  {match.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{match.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{match.skill}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MapPin size={10} />{match.distance}</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Star size={10} fill="#f59e0b" color="#f59e0b" />{match.rating}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <MessageSquare size={13} />
                  </button>
                  <button className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                    <Calendar size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sağ Sütun: Görüşmeler ve Liderlik Tablosu */}
        <div className="space-y-4">
          {/* Yaklaşan Görüşmeler */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Yaklaşan Görüşmeler</h3>
              <button onClick={() => onNavigate("calendar")} className="text-xs text-primary font-medium hover:underline">Takvim</button>
            </div>
            <div className="space-y-2.5">
              {UPCOMING_SESSIONS.map((session, i) => (
                <div key={session.title} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${session.color}14` }}>
                    {session.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{session.title}</div>
                    <div className="text-xs text-muted-foreground">{session.mentor} ile</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right whitespace-nowrap">{session.time.split(",")[0]}<br />{session.time.split(",")[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Liderlik Tablosu */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Liderlik Tablosu</h3>
              <span className="text-xs text-muted-foreground">Bu hafta</span>
            </div>
            <div className="space-y-2">
              {LEADERBOARD.map(user => (
                <div key={user.rank}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${user.isMe ? "border-2 border-primary/30 bg-primary/5" : "hover:bg-muted/50"}`}>
                  <span className="text-sm font-bold text-muted-foreground w-4">{user.badge || `#${user.rank}`}</span>
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  <span className={`flex-1 text-sm font-medium truncate ${user.isMe ? "text-primary" : "text-foreground"}`}>
                    {user.name}{user.isMe ? " (Sen)" : ""}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">{user.points.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}