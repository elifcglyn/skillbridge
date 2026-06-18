import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Search,
  UserRound,
  Video,
  X,
} from "lucide-react";
import {
  getSession,
  getSessionScope,
  getSessionStatusConfig,
  listSessions,
  updateSession,
  type SessionCounts,
  type SessionRole,
  type SessionScope,
  type SessionStatus,
  type SkillBridgeSession,
} from "@/lib/sessions";
import { supabase } from "@/lib/supabase";

type SessionsViewProps = {
  initialSessionId?: string | null;
  onOpenCalendar: (session?: SkillBridgeSession | null) => void;
  onOpenFeedback: (session: SkillBridgeSession) => void;
};

const EMPTY_COUNTS: SessionCounts = {
  invitations: 0,
  incomingInvitations: 0,
  upcoming: 0,
  history: 0,
};

const TABS: { id: SessionScope; label: string }[] = [
  { id: "invitations", label: "Davetler" },
  { id: "upcoming", label: "Yaklaşan" },
  { id: "history", label: "Geçmiş" },
];

const STATUS_OPTIONS: { value: "" | SessionStatus; label: string }[] = [
  { value: "", label: "Tüm durumlar" },
  { value: "pending", label: "Onay bekliyor" },
  { value: "scheduled", label: "Planlandı" },
  { value: "completed", label: "Tamamlandı" },
  { value: "declined", label: "Reddedildi" },
  { value: "cancelled", label: "İptal edildi" },
];

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SessionAvatar({ session }: { session: SkillBridgeSession }) {
  if (session.peer.avatarUrl) {
    return (
      <img
        src={session.peer.avatarUrl}
        alt={session.peer.name}
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ background: "var(--sb-gradient)" }}>
      {session.peer.name.charAt(0).toLocaleUpperCase("tr-TR")}
    </div>
  );
}

export function SessionsView({
  initialSessionId,
  onOpenCalendar,
  onOpenFeedback,
}: SessionsViewProps) {
  const [scope, setScope] = useState<SessionScope>("invitations");
  const [sessions, setSessions] = useState<SkillBridgeSession[]>([]);
  const [counts, setCounts] = useState<SessionCounts>(EMPTY_COUNTS);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"" | SessionRole>("");
  const [status, setStatus] = useState<"" | SessionStatus>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [pinnedSession, setPinnedSession] = useState<SkillBridgeSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listSessions({
        scope,
        q: query.trim() || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setSessions(response.data);
      setCounts(response.counts);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Görüşmeler yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSessionId) return;

    let active = true;
    getSession(initialSessionId)
      .then((session) => {
        if (!active) return;
        setScope(getSessionScope(session.status));
        setHighlightedId(session.id);
        setPinnedSession(session);
        setQuery("");
        setRole("");
        setStatus("");
        setPage(1);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Görüşme bulunamadı.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [initialSessionId]);

  useEffect(() => {
    const timer = window.setTimeout(loadSessions, 250);
    return () => window.clearTimeout(timer);
  }, [scope, query, role, status, page]);

  useEffect(() => {
    const channel = supabase
      .channel("sessions_management")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        loadSessions,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scope, query, role, status, page]);

  useEffect(() => {
    if (!highlightedId || loading) return;
    document
      .getElementById(`session-${highlightedId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedId, loading, sessions]);

  const activeTabCount = useMemo(() => {
    if (scope === "invitations") return counts.invitations;
    if (scope === "upcoming") return counts.upcoming;
    return counts.history;
  }, [counts, scope]);
  const displayedSessions = useMemo(() => {
    if (
      pinnedSession &&
      getSessionScope(pinnedSession.status) === scope &&
      !sessions.some((session) => session.id === pinnedSession.id)
    ) {
      return [pinnedSession, ...sessions];
    }
    return sessions;
  }, [pinnedSession, scope, sessions]);

  const changeScope = (nextScope: SessionScope) => {
    setScope(nextScope);
    setStatus("");
    setPage(1);
    setHighlightedId(null);
    setPinnedSession(null);
  };

  const runAction = async (
    session: SkillBridgeSession,
    action: "accept" | "decline" | "cancel" | "complete",
  ) => {
    setWorkingId(session.id);
    setError(null);

    try {
      const updatedSession = await updateSession(session.id, action);
      if (pinnedSession?.id === session.id) {
        setPinnedSession(updatedSession);
      }
      await loadSessions();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Görüşme güncellenemedi.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Görüşmeler</h2>
          <p className="text-sm text-muted-foreground">
            Davetlerini, yaklaşan görüşmelerini ve geçmişini yönet
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenCalendar(null)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--sb-gradient)" }}>
          <CalendarClock size={16} /> Yeni görüşme planla
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-muted">
        {TABS.map((tab) => {
          const count =
            tab.id === "invitations"
              ? counts.invitations
              : tab.id === "upcoming"
                ? counts.upcoming
                : counts.history;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => changeScope(tab.id)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                scope === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}>
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Kişi, başlık veya beceri ara..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value as "" | SessionRole);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none">
          <option value="">Tüm roller</option>
          <option value="creator">Oluşturan benim</option>
          <option value="invitee">Davet edilen benim</option>
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as "" | SessionStatus);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none">
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-600 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={loadSessions} className="font-semibold hover:underline">
            Tekrar dene
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{loading ? "Yükleniyor..." : `${total} kayıt`}</span>
        {scope === "invitations" && counts.incomingInvitations > 0 && (
          <span>{counts.incomingInvitations} davet yanıtını bekliyor</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : displayedSessions.length === 0 ? (
        <div className="py-14 px-6 rounded-2xl border border-dashed border-border bg-card text-center">
          <CalendarClock size={32} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="font-bold text-foreground">Bu bölümde görüşme yok</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Filtrelerini değiştirebilir veya takvimden yeni bir görüşme planlayabilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedSessions.map((session, index) => {
            const config = getSessionStatusConfig(session.status);
            const isWorking = workingId === session.id;
            const isHighlighted = highlightedId === session.id;

            return (
              <motion.article
                id={`session-${session.id}`}
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`p-4 sm:p-5 rounded-2xl border bg-card transition-all ${
                  isHighlighted
                    ? "border-primary shadow-md ring-2 ring-primary/10"
                    : "border-border hover:shadow-sm"
                }`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <SessionAvatar session={session} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-foreground">{session.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserRound size={12} /> {session.peer.name}
                          </span>
                          <span>·</span>
                          <span>
                            {session.role === "creator"
                              ? "Daveti sen oluşturdun"
                              : "Sana davet gönderildi"}
                          </span>
                        </div>
                      </div>
                      <span className={`self-start px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarClock size={14} />
                        <span>{formatSessionDate(session.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock size={14} />
                        <span>{session.durationMinutes} dakika</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video size={14} />
                        <span>{session.skillName || "Beceri paylaşımı"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {session.permissions.canAccept && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runAction(session, "accept")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-700 text-xs font-semibold disabled:opacity-40">
                          <Check size={13} /> Kabul et
                        </button>
                      )}
                      {session.permissions.canDecline && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runAction(session, "decline")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold disabled:opacity-40">
                          <X size={13} /> Reddet
                        </button>
                      )}
                      {session.permissions.canJoin && session.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold"
                          style={{ background: "var(--sb-gradient)" }}>
                          <ExternalLink size={13} /> Jitsi görüşmesine katıl
                        </a>
                      )}
                      {session.permissions.canReschedule && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => onOpenCalendar(session)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold disabled:opacity-40">
                          <RotateCcw size={13} /> Takvimde yeniden planla
                        </button>
                      )}
                      {session.permissions.canComplete && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runAction(session, "complete")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-700 text-xs font-semibold disabled:opacity-40">
                          <Check size={13} /> Tamamlandı
                        </button>
                      )}
                      {session.permissions.canCancel && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runAction(session, "cancel")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-muted-foreground text-xs font-semibold disabled:opacity-40">
                          İptal et
                        </button>
                      )}
                      {session.permissions.canGiveFeedback && (
                        <button
                          type="button"
                          onClick={() => onOpenFeedback(session)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 text-xs font-semibold">
                          <MessageSquare size={13} /> Geri bildirim ver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {!loading && activeTabCount > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="p-2 rounded-xl border border-border disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="p-2 rounded-xl border border-border disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
