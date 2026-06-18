import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, Check, Filter, MapPin, MessageSquare, Star, X, Zap } from "lucide-react";
import { apiGet, apiSend, withQuery } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type TabType = "recommended" | "pending" | "accepted" | "nearby";

interface MatchesViewProps {
  onNavigate: (view: string) => void;
  onOpenMessages: (peerId: string) => void;
  onOpenCalendar: (peerId: string) => void;
}

type AiPick = {
  matchId: string;
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  university: string | null;
  department: string | null;
  teaches: string[];
  learns: string[];
  skillName: string;
  matchedSkillName: string;
  status: string;
  matchScore: number;
  distanceKm: string | null;
};

type ConnectionRow = {
  id: string;
  requester_id: string | null;
  receiver_id: string | null;
  status: string | null;
  created_at: string;
};

type MatchCard = AiPick & {
  connectionId: string | null;
  connectionStatus: string;
  connectionReceiverId: string | null;
};

function normalizeStatus(value?: string | null) {
  return (value || "recommended").toLowerCase();
}

function avatarFor(match: MatchCard) {
  return match.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name || "U")}&background=random&color=fff&size=150`;
}

export function MatchesView({
  onNavigate,
  onOpenMessages,
  onOpenCalendar,
}: MatchesViewProps) {
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("recommended");
  const [selectedMatch, setSelectedMatch] = useState<MatchCard | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openingPeerId, setOpeningPeerId] = useState<string | null>(null);
  const [openingCalendarPeerId, setOpeningCalendarPeerId] = useState<string | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMatches([]);
        return;
      }

      setCurrentUserId(user.id);

      const [{ data: aiPicks }, { data: connections }] = await Promise.all([
        apiGet<{ data: AiPick[] }>(withQuery("/api/matches/ai-picks", { limit: 30 })),
        supabase
          .from("connections")
          .select("*")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false }),
      ]);

      const connectionRows = (connections ?? []) as ConnectionRow[];
      const connectionByPeer = new Map<string, ConnectionRow>();

      for (const connection of connectionRows) {
        const peerId = connection.requester_id === user.id ? connection.receiver_id : connection.requester_id;
        if (peerId && !connectionByPeer.has(peerId)) {
          connectionByPeer.set(peerId, connection);
        }
      }

      setMatches(
        (aiPicks ?? []).map((pick) => {
          const connection = connectionByPeer.get(pick.otherUserId);
          return {
            ...pick,
            connectionId: connection?.id ?? null,
            connectionStatus: normalizeStatus(connection?.status ?? pick.status),
            connectionReceiverId: connection?.receiver_id ?? null,
          };
        }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Eşleşmeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleConnectionStatus = async (match: MatchCard, status: "accepted" | "rejected") => {
    if (!match.connectionId) return;

    const { error: updateError } = await supabase
      .from("connections")
      .update({ status })
      .eq("id", match.connectionId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMatches((items) =>
      items.map((item) =>
        item.connectionId === match.connectionId ? { ...item, connectionStatus: status } : item,
      ),
    );
  };

  const handleOpenMessages = async (match: MatchCard) => {
    if (openingPeerId || openingCalendarPeerId) return;

    setOpeningPeerId(match.otherUserId);
    setError(null);

    try {
      await apiSend("/api/matches/selection", "POST", {
        otherUserId: match.otherUserId,
        skillName: match.skillName || match.teaches[0] || "Beceri paylaşımı",
        matchScore: match.matchScore,
      });
      onOpenMessages(match.otherUserId);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Eşleşme kaydedilemedi.",
      );
    } finally {
      setOpeningPeerId(null);
    }
  };

  const handleOpenCalendar = async (match: MatchCard) => {
    if (openingPeerId || openingCalendarPeerId) return;

    setOpeningCalendarPeerId(match.otherUserId);
    setError(null);

    try {
      await apiSend("/api/matches/selection", "POST", {
        otherUserId: match.otherUserId,
        skillName: match.skillName || match.teaches[0] || "Beceri paylaşımı",
        matchScore: match.matchScore,
      });
      onOpenCalendar(match.otherUserId);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Eşleşme kaydedilemedi.",
      );
    } finally {
      setOpeningCalendarPeerId(null);
    }
  };

  const tabs = useMemo(() => [
    { id: "recommended" as const, label: "AI Picks", count: matches.filter((match) => !["pending", "rejected"].includes(match.connectionStatus)).length },
    { id: "pending" as const, label: "Pending", count: matches.filter((match) => match.connectionStatus === "pending").length },
    { id: "accepted" as const, label: "Connected", count: matches.filter((match) => match.connectionStatus === "accepted").length },
    { id: "nearby" as const, label: "Nearby", count: matches.filter((match) => Number(match.distanceKm ?? 999) < 3).length },
  ], [matches]);

  const filtered = matches.filter((match) => {
    if (match.connectionStatus === "rejected") return false;
    if (activeTab === "pending") return match.connectionStatus === "pending";
    if (activeTab === "accepted") return match.connectionStatus === "accepted";
    if (activeTab === "nearby") return Number(match.distanceKm ?? 999) < 3;
    return match.connectionStatus !== "pending";
  });

  if (loading) {
    return <div className="p-6 flex justify-center text-muted-foreground animate-pulse">Eşleşmeler hesaplanıyor...</div>;
  }

  return (
    <div className="p-4 sm:p-6 flex gap-6 h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Matches</h2>
            <p className="text-sm text-muted-foreground">API tarafından hesaplanan eşleşmeler</p>
          </div>
          <div className="flex-1" />
          <button onClick={loadMatches} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted">
            <Filter size={14} /> Yenile
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
        )}

        <div className="p-3 rounded-2xl mb-4 flex items-center gap-3" style={{ background: "linear-gradient(90deg, #eef2ff, #f3e8ff)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--sb-gradient)" }}>
            <Zap size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-950 dark:text-indigo-200">AI Picks hazır</div>
            <div className="text-xs text-indigo-900/70 dark:text-indigo-300/70">Skorlar API üzerinde deterministik hesaplanır</div>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-muted mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto pb-4">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="col-span-full p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                Bu filtre için eşleşme yok.
              </div>
            ) : filtered.map((match, index) => (
              <motion.div
                key={match.matchId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 rounded-2xl border bg-card cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 flex flex-col ${
                  selectedMatch?.matchId === match.matchId ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ background: "linear-gradient(90deg, #10b981, #059669)" }}>
                    <Zap size={11} /> {match.matchScore}% match
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{match.connectionStatus}</span>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <img src={avatarFor(match)} alt={match.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-sm truncate">{match.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{match.university || "Kampüs içi"}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span className="text-xs font-medium text-foreground">{Math.max(0, Math.round(match.matchScore / 20))}</span>
                      <span className="text-xs text-muted-foreground">· AI score</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3 flex-1">
                  <span className="inline-flex max-w-full px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-xs truncate">
                    Teaches: {match.teaches.join(", ") || match.skillName || "Belirtilmemiş"}
                  </span>
                  <span className="inline-flex max-w-full px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-medium text-xs truncate">
                    Wants: {match.learns.join(", ") || match.matchedSkillName || "Belirtilmemiş"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={11} /> {match.distanceKm ? `${match.distanceKm}km` : "-"}
                  </span>
                  <div className="flex gap-1.5">
                    {match.connectionStatus === "pending" && match.connectionReceiverId === currentUserId ? (
                      <>
                        <button onClick={(event) => { event.stopPropagation(); handleConnectionStatus(match, "accepted"); }} className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <Check size={14} />
                        </button>
                        <button onClick={(event) => { event.stopPropagation(); handleConnectionStatus(match, "rejected"); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                          <X size={14} />
                        </button>
                      </>
                    ) : null}
                    <button
                      disabled={openingPeerId === match.otherUserId}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenMessages(match);
                      }}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40">
                      <MessageSquare size={14} />
                    </button>
                    <button
                      disabled={openingCalendarPeerId === match.otherUserId}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenCalendar(match);
                      }}
                      className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 disabled:opacity-40">
                      <Calendar size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
