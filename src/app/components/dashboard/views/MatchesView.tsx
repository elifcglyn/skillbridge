import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Star, MessageSquare, Calendar, Filter, Zap, Check, X } from "lucide-react";

const ALL_MATCHES = [
  { 
    id: 1, 
    name: "Ayşe Kara", 
    skill: "React & TypeScript", 
    wantSkill: "İngilizce", 
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop", 
    rating: 4.9, sessions: 12, distance: "0.3km", online: true, match: 97, 
    university: "Kırklareli Üniversitesi", status: "pending" 
  },
  { 
    id: 2, 
    name: "Mert Yıldız", 
    skill: "Python & Veri Analizi", 
    wantSkill: "Gitar", 
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop", 
    rating: 4.7, sessions: 8, distance: "0.8km", online: false, match: 92, 
    university: "Kırklareli Üniversitesi", status: "pending" 
  },
  { 
    id: 3, 
    name: "Zeynep Arslan", 
    skill: "UI/UX Tasarım", 
    wantSkill: "React", 
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop", 
    rating: 5.0, sessions: 19, distance: "1.1km", online: true, match: 89, 
    university: "Kırklareli Üniversitesi", status: "accepted" 
  },
  { 
    id: 4, 
    name: "Burak Şahin", 
    skill: "Fotoğrafçılık", 
    wantSkill: "Web Geliştirme", 
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop", 
    rating: 4.8, sessions: 11, distance: "2.0km", online: true, match: 85, 
    university: "Kırklareli Üniversitesi", status: "accepted" 
  },
  { 
    id: 5, 
    name: "Selin Öztürk", 
    skill: "İstatistik & Excel", 
    wantSkill: "Tasarım", 
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop", 
    rating: 4.9, sessions: 15, distance: "0.5km", online: false, match: 94, 
    university: "Kırklareli Üniversitesi", status: "pending" 
  },
  { 
    id: 6, 
    name: "Emre Doğan", 
    skill: "Gitar & Müzik Teorisi", 
    wantSkill: "Matematik", 
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop", 
    rating: 4.6, sessions: 9, distance: "3.2km", online: false, match: 78, 
    university: "Kırklareli Üniversitesi", status: "nearby" 
  },
];

type TabType = "recommended" | "pending" | "accepted" | "nearby";
interface MatchesViewProps {
  onNavigate: (view: string) => void;
}
export function MatchesView({ onNavigate }: MatchesViewProps) {
  const [matches, setMatches] = useState(ALL_MATCHES);
  const [activeTab, setActiveTab] = useState<TabType>("recommended");
  const [selectedMatch, setSelectedMatch] = useState<typeof ALL_MATCHES[0] | null>(null);

  const handleAccept = (id: number) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: "accepted" } : m));
  };

  const handleReject = (id: number) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status: "rejected" } : m));
  };
  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "recommended", label: "AI Picks", count: matches.filter(m => m.status !== "rejected").length },
    { id: "pending", label: "Pending", count: matches.filter(m => m.status === "pending").length },
    { id: "accepted", label: "Connected", count: matches.filter(m => m.status === "accepted").length },
    { id: "nearby", label: "Nearby", count: matches.filter(m => parseFloat(m.distance) < 3 && m.status !== "rejected").length },
  ];

  const filtered = matches.filter(m => {
    if (m.status === "rejected") return false; // Reddedilenler hiçbir yerde görünmez
    if (activeTab === "pending") return m.status === "pending";
    if (activeTab === "accepted") return m.status === "accepted";
    if (activeTab === "nearby") return parseFloat(m.distance) < 3;
    return m.status !== "pending"; // "AI Picks" sekmesinde bekleyenler de gösterilsin ama istersen kaldırabiliriz
  });

  return (
    <div className="p-4 sm:p-6 flex gap-6 h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Matches</h2>
            <p className="text-sm text-muted-foreground">People matched to your skill profile</p>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm text-muted-foreground">
            <Filter size={14} /> Filter
          </div>
        </div>

        {/* AI Banner */}
        <div className="p-3 rounded-2xl mb-4 flex items-center gap-3"
          style={{ background: "linear-gradient(90deg, #eef2ff, #f3e8ff)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--sb-gradient)" }}>
            <Zap size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">AI found 3 new matches this morning</div>
            <div className="text-xs text-muted-foreground">Based on your Python skills and location near MIT</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted mb-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Match cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          <AnimatePresence>
            {filtered.map((match, i) => (
              <motion.div key={match.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 rounded-2xl border bg-card cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 ${selectedMatch?.id === match.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                {/* Match score badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: `linear-gradient(90deg, ${match.match >= 90 ? "#10b981" : "#f59e0b"}, ${match.match >= 90 ? "#059669" : "#d97706"})` }}>
                    <Zap size={11} /> {match.match}% match
                  </div>
                  {match.online && (
                    <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-400" /> Online
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <img src={match.avatar} alt={match.name} className="w-12 h-12 rounded-xl object-cover" />
                    {match.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">{match.name}</div>
                    <div className="text-xs text-muted-foreground">{match.university}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span className="text-xs font-medium text-foreground">{match.rating}</span>
                      <span className="text-xs text-muted-foreground">· {match.sessions} sessions</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Teaches: {match.skill}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">Wants: {match.wantSkill}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={11} /> {match.distance}
                  </span>
                  <div className="flex gap-1.5">
                    {match.status === "pending" ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleAccept(match.id); }}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(match.id); }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); onNavigate("messages"); }}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onNavigate("calendar"); }}
                          className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors">
                          <Calendar size={14} />
                        </button>
                      </>
                    
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Match detail panel */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="hidden xl:flex flex-col w-80 p-5 rounded-2xl border border-border bg-card shadow-sm h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-foreground">Profile</span>
              <button onClick={() => setSelectedMatch(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            <img src={selectedMatch.avatar} alt={selectedMatch.name} className="w-full h-40 object-cover rounded-xl mb-4" />
            <h3 className="font-extrabold text-foreground text-lg">{selectedMatch.name}</h3>
            <p className="text-muted-foreground text-sm mb-1">{selectedMatch.university}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <MapPin size={13} /> {selectedMatch.distance} away
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Rating", value: `${selectedMatch.rating}⭐` },
                { label: "Sessions", value: selectedMatch.sessions },
                { label: "Match", value: `${selectedMatch.match}%` },
                { label: "Status", value: selectedMatch.online ? "Online" : "Offline" },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-xl bg-muted/50 text-center">
                  <div className="font-bold text-foreground text-sm">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/8">
                <div className="text-xs text-muted-foreground">Teaches</div>
                <div className="font-semibold text-primary text-sm">{selectedMatch.skill}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-50">
                <div className="text-xs text-muted-foreground">Wants to learn</div>
                <div className="font-semibold text-cyan-700 text-sm">{selectedMatch.wantSkill}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onNavigate("messages")}
                className="py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-all flex items-center justify-center gap-1.5">
                <MessageSquare size={14} /> Message
              </button>
              <button onClick={() => onNavigate("calendar")}
                className="py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: "var(--sb-gradient)" }}>
                <Calendar size={14} /> Schedule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
