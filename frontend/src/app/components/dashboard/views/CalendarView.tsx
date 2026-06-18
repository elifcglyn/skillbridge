import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarPlus, Clock, Link, MapPin, Plus, User, Video } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Session = {
  id: string;
  mentorId: string | null;
  learnerId: string | null;
  studentId: string | null;
  title: string;
  skillName: string;
  scheduledAt: string;
  durationMinutes: number;
  deliveryType: string;
  status: string;
  meetingLink: string | null;
  color: string;
  emoji: string;
};

type Peer = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

function peerName(peer: Peer) {
  return peer.full_name || [peer.first_name, peer.last_name].filter(Boolean).join(" ").trim() || "SkillBridge Kullanıcısı";
}

function toDateTimeLocal(date: Date) {
  const next = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return next.toISOString().slice(0, 16);
}

export function CalendarView() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [title, setTitle] = useState("SkillBridge Görüşmesi");
  const [peerId, setPeerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    return toDateTimeLocal(tomorrow);
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSessions([]);
        return;
      }

      setUserId(user.id);

      const [{ data: sessionsData }, { data: profileRows }] = await Promise.all([
        apiGet<{ data: Session[] }>("/api/sessions"),
        supabase
          .from("profiles")
          .select("id,full_name,first_name,last_name")
          .not("id", "eq", user.id)
          .limit(50),
      ]);

      setSessions(sessionsData ?? []);
      setPeers((profileRows ?? []) as Peer[]);

      const preferredPeer = localStorage.getItem("active_chat_partner_id") || (profileRows?.[0]?.id ?? "");
      setPeerId((current) => current || preferredPeer);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Takvim yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const daysInMonth = 30;
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const selectedSessions = useMemo(
    () => sessions.filter((session) => new Date(session.scheduledAt).getDate() === selectedDay),
    [selectedDay, sessions],
  );

  const createSession = async () => {
    if (!userId || !peerId || !scheduledAt) return;

    setSaving(true);
    setError(null);

    try {
      const response = await apiSend<{ data: Session }>("/api/sessions", "POST", {
        learnerId: peerId,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: 60,
        deliveryType: "video",
      });

      setSessions((items) => [...items, response.data].sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Görüşme oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 flex gap-6 h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-extrabold text-foreground">Calendar</h2>
          <div className="flex-1" />
          <button onClick={loadCalendar} className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted">
            Yenile
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex-1">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-foreground text-lg">
              {new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date())}
            </h3>
            <span className="text-xs text-muted-foreground">{sessions.length} görüşme</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const daySessions = sessions.filter((session) => new Date(session.scheduledAt).getDate() === day);
              const isSelected = day === selectedDay;
              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm font-medium ${
                    isSelected ? "text-white shadow-md" : "hover:bg-muted text-foreground"
                  }`}
                  style={isSelected ? { background: "var(--sb-gradient)" } : {}}>
                  {day}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {daySessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "rgba(255,255,255,0.8)" : session.color }} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">Seçili gün: {selectedDay}</h3>
              <p className="text-xs text-muted-foreground">{selectedSessions.length} görüşme</p>
            </div>
            <CalendarPlus size={18} className="text-muted-foreground" />
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Yükleniyor...</div>
          ) : selectedSessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Bu gün için görüşme yok.</div>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((session) => (
                <motion.div key={session.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-3.5 rounded-xl border border-border hover:shadow-sm" style={{ borderLeft: `3px solid ${session.color}` }}>
                  <div className="font-semibold text-foreground text-sm mb-1">{session.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <User size={11} /> {session.skillName || "Beceri paylaşımı"}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{session.durationMinutes} dk</span>
                    <span className="flex items-center gap-1">{session.deliveryType === "video" ? <Video size={11} /> : <MapPin size={11} />}{session.deliveryType}</span>
                  </div>
                  {session.meetingLink && (
                    <a href={session.meetingLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <Link size={11} /> Jitsi linki
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
          <h4 className="font-bold text-foreground">Görüşme oluştur</h4>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none" placeholder="Başlık" />
          <select value={peerId} onChange={(event) => setPeerId(event.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none">
            <option value="">Kişi seç</option>
            {peers.map((peer) => (
              <option key={peer.id} value={peer.id}>{peerName(peer)}</option>
            ))}
          </select>
          <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none" />
          <button onClick={createSession} disabled={!peerId || saving} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: "var(--sb-gradient)" }}>
            <Plus size={15} /> {saving ? "Oluşturuluyor..." : "Jitsi linkli oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}
