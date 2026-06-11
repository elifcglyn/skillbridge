import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Video, User } from "lucide-react";

const SESSIONS = [
  { id: 1, title: "Python: Decorators", mentor: "Aria Chen", time: "3:00 PM", duration: "60 min", day: 4, color: "#4338ca", type: "video" },
  { id: 2, title: "UI/UX Workshop", mentor: "Zara Ahmed", time: "2:00 PM", duration: "90 min", day: 5, color: "#7c3aed", type: "video" },
  { id: 3, title: "Spanish Conversation", mentor: "Carlos M.", time: "11:00 AM", duration: "45 min", day: 8, color: "#06b6d4", type: "in-person" },
  { id: 4, title: "React Deep Dive", mentor: "Priya Sharma", time: "4:00 PM", duration: "75 min", day: 10, color: "#10b981", type: "video" },
  { id: 5, title: "Big Skill Exchange Day", mentor: "Community Event", time: "10:00 AM", duration: "All day", day: 15, color: "#ec4899", type: "campus" },
  { id: 6, title: "Guitar: Chord Transitions", mentor: "Leo Nakamura", time: "6:00 PM", duration: "60 min", day: 12, color: "#f59e0b", type: "in-person" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const [selectedDay, setSelectedDay] = useState(4);
  const [view, setView] = useState<"month" | "week">("month");

  const today = new Date();
  const month = today.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = 30;
  const startDay = 0; // Sunday start
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddedDays = [...Array(startDay).fill(null), ...calDays];

  const dayHasSessions = (day: number) => SESSIONS.filter(s => s.day === day);
  const selectedSessions = SESSIONS.filter(s => s.day === selectedDay);

  return (
    <div className="p-4 sm:p-6 flex gap-6 h-full">
      {/* Calendar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-extrabold text-foreground">Calendar</h2>
          <div className="flex-1" />
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {["month", "week"].map(v => (
              <button key={v} onClick={() => setView(v as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${view === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            style={{ background: "var(--sb-gradient)" }}>
            <Plus size={15} /> Schedule
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex-1">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronLeft size={18} /></button>
            <h3 className="font-extrabold text-foreground text-lg">{month}</h3>
            <button className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronRight size={18} /></button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const sessions = dayHasSessions(day);
              const isToday = day === today.getDate();
              const isSelected = day === selectedDay;

              return (
                <motion.button key={day} whileHover={{ scale: 1.05 }} onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all text-sm font-medium ${
                    isSelected ? "text-white shadow-md" : isToday ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                  }`}
                  style={isSelected ? { background: "var(--sb-gradient)" } : {}}>
                  {day}
                  {sessions.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {sessions.slice(0, 3).map((s, si) => (
                        <div key={si} className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "rgba(255,255,255,0.8)" : s.color }} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day detail */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">June {selectedDay}</h3>
              <p className="text-xs text-muted-foreground">{selectedSessions.length} sessions scheduled</p>
            </div>
            <button className="p-2 rounded-xl hover:bg-muted transition-colors">
              <Plus size={16} className="text-muted-foreground" />
            </button>
          </div>

          {selectedSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm text-muted-foreground">No sessions on this day</p>
              <button className="mt-3 text-xs text-primary font-medium hover:underline">+ Schedule one</button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map(session => (
                <motion.div key={session.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="p-3.5 rounded-xl border border-border hover:shadow-sm transition-all cursor-pointer"
                  style={{ borderLeft: `3px solid ${session.color}` }}>
                  <div className="font-semibold text-foreground text-sm mb-1">{session.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <User size={11} /> {session.mentor}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={11} /> {session.time}</span>
                    <span>{session.duration}</span>
                    <span className="flex items-center gap-1 capitalize">
                      {session.type === "video" ? <Video size={11} /> : <MapPin size={11} />}
                      {session.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Availability planner */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <h4 className="font-bold text-foreground mb-3">Set Availability</h4>
          <div className="space-y-2">
            {["Morning (8am-12pm)", "Afternoon (12pm-6pm)", "Evening (6pm-10pm)"].map((slot, i) => (
              <div key={slot} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                <span className="text-xs font-medium text-foreground">{slot}</span>
                <button className={`w-9 h-5 rounded-full transition-all relative ${i === 0 || i === 1 ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${i === 0 || i === 1 ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
