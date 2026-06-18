import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link,
  Plus,
  RotateCcw,
  User,
  Video,
  X,
} from "lucide-react";
import { apiGet, apiSend, withQuery } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type SessionStatus = "pending" | "scheduled" | "declined" | "cancelled" | "completed";
type SessionAction = "accept" | "decline" | "cancel" | "reschedule" | "complete";

type Session = {
  id: string;
  matchId: string | null;
  mentorId: string | null;
  learnerId: string | null;
  studentId: string | null;
  title: string;
  skillName: string;
  scheduledAt: string;
  durationMinutes: number;
  deliveryType: string;
  status: SessionStatus;
  meetingLink: string | null;
  color: string;
  emoji: string;
  peer: {
    id: string | null;
    name: string;
    avatarUrl: string | null;
  };
  permissions: {
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
    canReschedule: boolean;
    canComplete: boolean;
  };
};

type SelectedMatch = {
  matchId: string;
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  skillName: string;
  status: string;
  matchScore: number;
};

type CalendarViewProps = {
  initialPeerId?: string | null;
};

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DURATIONS = [30, 45, 60, 90];
const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; className: string }> = {
  pending: {
    label: "Onay bekliyor",
    color: "#f59e0b",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  scheduled: {
    label: "Planlandı",
    color: "#10b981",
    className: "bg-green-500/10 text-green-700 dark:text-green-300",
  },
  declined: {
    label: "Reddedildi",
    color: "#ef4444",
    className: "bg-red-500/10 text-red-600",
  },
  cancelled: {
    label: "İptal edildi",
    color: "#64748b",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  completed: {
    label: "Tamamlandı",
    color: "#6366f1",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSameDay(first: Date, second: Date) {
  return dateKey(first) === dateKey(second);
}

function toDateTimeLocal(date: Date) {
  const next = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return next.toISOString().slice(0, 16);
}

function defaultScheduledAt(baseDate = new Date()) {
  const candidate = new Date(baseDate);
  candidate.setHours(15, 0, 0, 0);

  if (candidate.getTime() <= Date.now()) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return toDateTimeLocal(candidate);
}

function monthRange(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { from, to };
}

function statusConfig(status: string) {
  return STATUS_CONFIG[(status as SessionStatus) || "pending"] ?? STATUS_CONFIG.pending;
}

export function CalendarView({ initialPeerId }: CalendarViewProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [matches, setMatches] = useState<SelectedMatch[]>([]);
  const [title, setTitle] = useState("SkillBridge Görüşmesi");
  const [peerId, setPeerId] = useState("");
  const [skillName, setSkillName] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => defaultScheduledAt(today));
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = async () => {
    setLoading(true);
    setError(null);

    try {
      const { from, to } = monthRange(viewMonth);
      const [{ data: sessionRows }, { data: selectedMatches }] = await Promise.all([
        apiGet<{ data: Session[] }>(
          withQuery("/api/sessions", {
            from: from.toISOString(),
            to: to.toISOString(),
          }),
        ),
        apiGet<{ data: SelectedMatch[] }>("/api/matches/selected"),
      ]);

      const nextMatches = selectedMatches ?? [];
      setSessions(sessionRows ?? []);
      setMatches(nextMatches);

      const preferredPeer =
        (initialPeerId && nextMatches.find((match) => match.otherUserId === initialPeerId)) ||
        nextMatches.find((match) => match.otherUserId === peerId) ||
        nextMatches[0];

      if (preferredPeer) {
        setPeerId(preferredPeer.otherUserId);
        setSkillName(preferredPeer.skillName);
        setTitle((current) =>
          current === "SkillBridge Görüşmesi" ? `${preferredPeer.skillName} Görüşmesi` : current,
        );
      } else {
        setPeerId("");
        setSkillName("");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Takvim yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();

    const channel = supabase
      .channel(`calendar_sessions_${viewMonth.getFullYear()}_${viewMonth.getMonth()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => loadCalendar(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewMonth.getFullYear(), viewMonth.getMonth(), initialPeerId]);

  const selectedMatch = matches.find((match) => match.otherUserId === peerId) ?? null;
  const { from: monthStart } = monthRange(viewMonth);
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const selectedSessions = useMemo(
    () =>
      sessions.filter((session) =>
        isSameDay(new Date(session.scheduledAt), selectedDate),
      ),
    [selectedDate, sessions],
  );

  const sessionCountInMonth = sessions.filter(
    (session) => !["declined", "cancelled"].includes(session.status),
  ).length;

  const selectDay = (day: number) => {
    const nextDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    setSelectedDate(nextDate);

    const currentScheduled = new Date(scheduledAt);
    const nextScheduled = new Date(nextDate);
    nextScheduled.setHours(
      Number.isFinite(currentScheduled.getTime()) ? currentScheduled.getHours() : 15,
      Number.isFinite(currentScheduled.getTime()) ? currentScheduled.getMinutes() : 0,
      0,
      0,
    );

    if (nextScheduled.getTime() > Date.now()) {
      setScheduledAt(toDateTimeLocal(nextScheduled));
    }
  };

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + offset,
      1,
    );
    setViewMonth(nextMonth);
    setSelectedDate(nextMonth);
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
    setScheduledAt(defaultScheduledAt(now));
  };

  const resetForm = (baseDate = selectedDate) => {
    setEditingSessionId(null);
    setScheduledAt(defaultScheduledAt(baseDate));
    setDurationMinutes(60);
    if (selectedMatch) {
      setTitle(`${selectedMatch.skillName} Görüşmesi`);
      setSkillName(selectedMatch.skillName);
    }
  };

  const submitSession = async () => {
    if (!selectedMatch || !scheduledAt || saving) return;

    setSaving(true);
    setError(null);

    try {
      if (editingSessionId) {
        const response = await apiSend<{ data: Session }>(
          `/api/sessions/${editingSessionId}`,
          "PATCH",
          {
            action: "reschedule",
            scheduledAt: new Date(scheduledAt).toISOString(),
            durationMinutes,
          },
        );
        setSessions((items) =>
          items.map((session) =>
            session.id === editingSessionId ? response.data : session,
          ),
        );
        const updatedDate = new Date(response.data.scheduledAt);
        setViewMonth(
          new Date(updatedDate.getFullYear(), updatedDate.getMonth(), 1),
        );
        setSelectedDate(updatedDate);
        resetForm(updatedDate);
      } else {
        const response = await apiSend<{ data: Session }>("/api/sessions", "POST", {
          matchId: selectedMatch.matchId,
          learnerId: selectedMatch.otherUserId,
          title: title.trim() || `${selectedMatch.skillName} Görüşmesi`,
          skillName: skillName || selectedMatch.skillName,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
        });

        const createdDate = new Date(response.data.scheduledAt);
        setViewMonth(new Date(createdDate.getFullYear(), createdDate.getMonth(), 1));
        setSelectedDate(createdDate);
        setSessions((items) =>
          [...items.filter((session) => session.id !== response.data.id), response.data].sort(
            (left, right) =>
              new Date(left.scheduledAt).getTime() -
              new Date(right.scheduledAt).getTime(),
          ),
        );
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Görüşme kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const runSessionAction = async (session: Session, action: SessionAction) => {
    setWorkingSessionId(session.id);
    setError(null);

    try {
      const response = await apiSend<{ data: Session }>(
        `/api/sessions/${session.id}`,
        "PATCH",
        { action },
      );
      setSessions((items) =>
        items.map((item) => (item.id === session.id ? response.data : item)),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Görüşme güncellenemedi.",
      );
    } finally {
      setWorkingSessionId(null);
    }
  };

  const beginReschedule = (session: Session) => {
    setEditingSessionId(session.id);
    setPeerId(session.peer.id || "");
    setSkillName(session.skillName);
    setTitle(session.title);
    setScheduledAt(toDateTimeLocal(new Date(session.scheduledAt)));
    setDurationMinutes(session.durationMinutes);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6 min-h-full">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Takvim</h2>
            <p className="text-sm text-muted-foreground">
              Görüşme davetlerini planla ve yönet
            </p>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted">
            Bugün
          </button>
          <button
            type="button"
            onClick={loadCalendar}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted">
            Yenile
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm flex-1">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-xl hover:bg-muted"
              aria-label="Önceki ay">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h3 className="font-extrabold text-foreground text-lg capitalize">
                {new Intl.DateTimeFormat("tr-TR", {
                  month: "long",
                  year: "numeric",
                }).format(viewMonth)}
              </h3>
              <span className="text-xs text-muted-foreground">
                {sessionCountInMonth} aktif görüşme
              </span>
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-2 rounded-xl hover:bg-muted"
              aria-label="Sonraki ay">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="py-2 text-center text-[11px] sm:text-xs font-semibold text-muted-foreground">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, index) => {
              if (day === null) {
                return <div key={`blank-${index}`} className="aspect-square" />;
              }

              const cellDate = new Date(
                viewMonth.getFullYear(),
                viewMonth.getMonth(),
                day,
              );
              const daySessions = sessions.filter((session) =>
                isSameDay(new Date(session.scheduledAt), cellDate),
              );
              const isSelected = isSameDay(cellDate, selectedDate);
              const isToday = isSameDay(cellDate, today);

              return (
                <motion.button
                  key={dateKey(cellDate)}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => selectDay(day)}
                  className={`relative aspect-square min-h-10 flex flex-col items-center justify-start pt-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isSelected
                      ? "text-white shadow-md"
                      : isToday
                        ? "border border-primary text-primary"
                        : "hover:bg-muted text-foreground"
                  }`}
                  style={isSelected ? { background: "var(--sb-gradient)" } : {}}>
                  {day}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {daySessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: isSelected
                              ? "rgba(255,255,255,0.85)"
                              : statusConfig(session.status).color,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">
                {new Intl.DateTimeFormat("tr-TR", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                }).format(selectedDate)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedSessions.length} görüşme
              </p>
            </div>
            <CalendarCheck size={18} className="text-muted-foreground" />
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
              Yükleniyor...
            </div>
          ) : selectedSessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Bu gün için görüşme yok.
            </div>
          ) : (
            <div className="space-y-3 max-h-[34rem] overflow-y-auto pr-1">
              {selectedSessions.map((session) => {
                const config = statusConfig(session.status);
                const isWorking = workingSessionId === session.id;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3.5 rounded-xl border border-border hover:shadow-sm"
                    style={{ borderLeft: `3px solid ${config.color}` }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-semibold text-foreground text-sm">
                        {session.title}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${config.className}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <User size={11} /> {session.peer.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <CalendarPlus size={11} />{" "}
                      {session.skillName || "Beceri paylaşımı"}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(session.scheduledAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>{session.durationMinutes} dk</span>
                      <span className="flex items-center gap-1">
                        <Video size={11} /> Video
                      </span>
                    </div>

                    {session.status === "scheduled" && session.meetingLink && (
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                        <Link size={11} /> Jitsi görüşmesine katıl
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {session.permissions.canAccept && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runSessionAction(session, "accept")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-700 text-xs font-semibold disabled:opacity-40">
                          <Check size={12} /> Kabul et
                        </button>
                      )}
                      {session.permissions.canDecline && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runSessionAction(session, "decline")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-semibold disabled:opacity-40">
                          <X size={12} /> Reddet
                        </button>
                      )}
                      {session.permissions.canReschedule && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => beginReschedule(session)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold disabled:opacity-40">
                          <RotateCcw size={12} /> Yeniden planla
                        </button>
                      )}
                      {session.permissions.canComplete && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runSessionAction(session, "complete")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 text-xs font-semibold disabled:opacity-40">
                          <CalendarCheck size={12} /> Tamamlandı
                        </button>
                      )}
                      {session.permissions.canCancel && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => runSessionAction(session, "cancel")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-semibold disabled:opacity-40">
                          İptal et
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-foreground">
              {editingSessionId ? "Görüşmeyi yeniden planla" : "Görüşme daveti oluştur"}
            </h4>
            {editingSessionId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-muted-foreground hover:text-foreground">
                Vazgeç
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              Görüşme planlamak için önce bir beceri eşleşmesi oluşturmalısın.
            </div>
          ) : (
            <>
              <select
                value={peerId}
                disabled={Boolean(editingSessionId)}
                onChange={(event) => {
                  const nextPeerId = event.target.value;
                  const nextMatch = matches.find(
                    (match) => match.otherUserId === nextPeerId,
                  );
                  setPeerId(nextPeerId);
                  setSkillName(nextMatch?.skillName ?? "");
                  if (nextMatch) setTitle(`${nextMatch.skillName} Görüşmesi`);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none disabled:opacity-60">
                <option value="">Eşleşme seç</option>
                {matches.map((match) => (
                  <option key={match.matchId} value={match.otherUserId}>
                    {match.name} · {match.skillName}
                  </option>
                ))}
              </select>
              <input
                value={skillName}
                readOnly
                className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm outline-none"
                placeholder="Eşleşilen beceri"
              />
              <input
                value={title}
                disabled={Boolean(editingSessionId)}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none disabled:opacity-60"
                placeholder="Başlık"
              />
              <input
                type="datetime-local"
                min={toDateTimeLocal(new Date())}
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none"
              />
              <select
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none">
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} dakika
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={submitSession}
                disabled={!selectedMatch || !scheduledAt || saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--sb-gradient)" }}>
                {editingSessionId ? <RotateCcw size={15} /> : <Plus size={15} />}
                {saving
                  ? "Kaydediliyor..."
                  : editingSessionId
                    ? "Yeni onaya gönder"
                    : "Daveti gönder"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
