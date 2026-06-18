import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Zap, Star, BookOpen,
  GraduationCap, Calendar, Award, Flame, ChevronRight, MapPin, MessageSquare
} from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { getHomeDashboard, type HomeDashboardData } from "@/lib/homeDashboard";

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenSession?: (sessionId: string) => void;
  onOpenMessages?: (peerId: string) => void;
  onOpenCalendar?: (peerId: string) => void;
  dashboardData?: HomeDashboardData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

function AvatarTile({ src, name, className }: { src?: string | null; name: string; className: string }) {
  if (src) {
    return <img src={src} alt={name} className={`${className} object-cover`} />;
  }

  return (
    <div className={`${className} flex items-center justify-center text-white font-bold`} style={{ background: "var(--sb-gradient)" }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function EmptyText({ children }: { children: string }) {
  return (
    <div className="py-6 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function getFallbackDashboard(): HomeDashboardData {
  return {
    generatedAt: new Date(0).toISOString(),
    user: {
      id: "",
      firstName: "Öğrenci",
      fullName: "Öğrenci",
      schoolInfo: "Üniversite Öğrencisi",
      avatarUrl: null,
      skillPoints: 0,
      coinBalance: 0,
      trustScore: 0,
      reviewCount: 0,
      streakDays: 0,
      nextLevelPoints: 0,
      pointsToNextLevel: 0,
    },
    stats: {
      sessions: { value: "0", trend: "Bu hafta +0" },
      teachingHours: { value: "0s", trend: "Bugün +0s" },
      skillPoints: { value: "0", trend: "Bugün +0" },
      trustScore: { value: "0", trend: "Top %0" },
    },
    weeklyLearning: {
      totalHours: 0,
      data: [
        { day: "Pzt", hours: 0 },
        { day: "Sal", hours: 0 },
        { day: "Çar", hours: 0 },
        { day: "Per", hours: 0 },
        { day: "Cum", hours: 0 },
        { day: "Cmt", hours: 0 },
        { day: "Paz", hours: 0 },
      ],
    },
    activeSkills: [],
    nextAchievement: null,
    recentMatches: [],
    upcomingSessions: [],
    leaderboard: [],
    sidebar: {
      matchCount: 0,
      messageCount: 0,
      sessionCount: 0,
      notificationCount: 0,
      skillPoints: 0,
      coinBalance: 0,
      nextLevelPoints: 0,
      pointsToNextLevel: 0,
      skillPointProgress: 0,
    },
  };
}

export function HomeView({
  onNavigate,
  onOpenSession,
  onOpenMessages,
  onOpenCalendar,
  dashboardData,
  loading,
  error,
  onRefresh,
}: HomeViewProps) {
  const [localData, setLocalData] = useState<HomeDashboardData | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shouldLoadLocally = dashboardData === undefined && loading === undefined;

  useEffect(() => {
    if (!shouldLoadLocally) return;

    let ignore = false;
    setLocalLoading(true);
    setLocalError(null);

    getHomeDashboard()
      .then((data) => {
        if (!ignore) setLocalData(data);
      })
      .catch((loadError: Error) => {
        if (!ignore) setLocalError(loadError.message);
      })
      .finally(() => {
        if (!ignore) setLocalLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [shouldLoadLocally]);

  const data = dashboardData ?? localData ?? getFallbackDashboard();
  const isLoading = loading ?? localLoading;
  const loadError = error ?? localError;
  const statCards = [
    { label: "Görüşmeler", value: data.stats.sessions.value, icon: BookOpen, color: "#4338ca", trend: data.stats.sessions.trend },
    { label: "Öğretim Saati", value: data.stats.teachingHours.value, icon: GraduationCap, color: "#7c3aed", trend: data.stats.teachingHours.trend },
    { label: "Beceri Puanı", value: data.stats.skillPoints.value, icon: Zap, color: "#06b6d4", trend: data.stats.skillPoints.trend },
    { label: "Güven Skoru", value: data.stats.trustScore.value, icon: Star, color: "#10b981", trend: data.stats.trustScore.trend },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {loadError && (
        <div className="p-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button onClick={onRefresh} className="font-semibold hover:underline">Tekrar dene</button>
        </div>
      )}

      {/* Karşılama Başlığı */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted-foreground text-sm mb-1">İyi çalışmalar 👋</div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Tekrar hoş geldin, {data.user.firstName}!
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-border bg-card">
          <Flame size={16} className="text-orange-500" />
          <span className="text-sm font-bold text-foreground">
            {isLoading ? "..." : `${data.user.streakDays} günlük seri`}
          </span>
        </div>
      </div>

      {/* İstatistik Satırı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}14` }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span className="text-xs text-green-500 font-medium">{isLoading ? "..." : stat.trend}</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground mb-0.5">{isLoading ? "..." : stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Öğrenme Aktiviteleri Grafiği */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Bu Haftaki Öğrenim</h3>
            <span className="text-xs text-muted-foreground">
              Toplam: {isLoading ? "..." : `${data.weeklyLearning.totalHours}s`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.weeklyLearning.data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
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
            {data.activeSkills.length === 0 ? (
              <EmptyText>Henüz aktif beceri kaydı yok.</EmptyText>
            ) : data.activeSkills.map(skill => (
              <div key={skill.id}>
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
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {skill.sessionsCompleted} görüşme · {skill.hours}s
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} className="text-yellow-500" />
              <span className="text-xs font-bold text-foreground">
                {data.nextAchievement?.title ?? "Sıradaki Başarı"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {data.nextAchievement?.description ?? "Aktif başarı hedefin oluştuğunda burada görünecek."}
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full bg-yellow-400"
                style={{ width: `${data.nextAchievement?.progressPercent ?? 0}%` }}
              />
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
            {data.recentMatches.length === 0 ? (
              <EmptyText>Yeni eşleşme bulunmuyor.</EmptyText>
            ) : data.recentMatches.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all group">
                <div className="relative flex-shrink-0">
                  <AvatarTile src={match.avatar} name={match.name} className="w-11 h-11 rounded-xl" />
                  {match.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{match.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{match.skill}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MapPin size={10} />{match.distance}</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star size={10} fill={match.reviewCount > 0 ? "#f59e0b" : "transparent"} color="#f59e0b" />
                      {match.reviewCount > 0 ? match.rating.toFixed(1) : "Yeni"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    aria-label={`${match.name} kişisine mesaj gönder`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenMessages
                        ? onOpenMessages(match.otherUserId)
                        : onNavigate("messages");
                    }}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <MessageSquare size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${match.name} ile görüşme planla`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenCalendar
                        ? onOpenCalendar(match.otherUserId)
                        : onNavigate("calendar");
                    }}
                    className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
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
              <button onClick={() => onNavigate("sessions")} className="text-xs text-primary font-medium hover:underline">Görüşmeler</button>
            </div>
            <div className="space-y-2.5">
              {data.upcomingSessions.length === 0 ? (
                <EmptyText>Yaklaşan görüşme bulunmuyor.</EmptyText>
              ) : data.upcomingSessions.map((session) => {
                const formattedDate = new Intl.DateTimeFormat("tr-TR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(session.scheduledAt));
                const [dateLabel, timeLabel = ""] = formattedDate
                  .split(",")
                  .map(part => part.trim());

                return (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() =>
                      onOpenSession
                        ? onOpenSession(session.id)
                        : onNavigate("sessions")
                    }
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all text-left">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${session.color}14` }}>
                      {session.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{session.title}</div>
                      <div className="text-xs text-muted-foreground">{session.peerName} ile</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right whitespace-nowrap">{dateLabel}<br />{timeLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liderlik Tablosu */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">Liderlik Tablosu</h3>
              <span className="text-xs text-muted-foreground">Genel</span>
            </div>
            <div className="space-y-2">
              {data.leaderboard.length === 0 ? (
                <EmptyText>Liderlik verisi henüz oluşmadı.</EmptyText>
              ) : data.leaderboard.map(user => (
                <div key={user.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${user.isMe ? "border-2 border-primary/30 bg-primary/5" : "hover:bg-muted/50"}`}>
                  <span className="text-sm font-bold text-muted-foreground w-4">{user.badge || `#${user.rank}`}</span>
                  <AvatarTile src={user.avatar} name={user.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                  <span className={`flex-1 text-sm font-medium truncate ${user.isMe ? "text-primary" : "text-foreground"}`}>
                    {user.name}{user.isMe ? " (Sen)" : ""}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">{user.points.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
