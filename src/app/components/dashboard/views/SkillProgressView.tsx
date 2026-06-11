import { motion } from "motion/react";
import {
  Flame, Clock, Target, Zap, BookOpen
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

const SKILLS = [
  { name: "Python", level: "Intermediate", progress: 67, sessions: 12, hours: 18, color: "#4338ca", emoji: "🐍", streak: 12, nextLevel: "Advanced", pointsToNext: 320 },
  { name: "Spanish", level: "Beginner", progress: 45, sessions: 8, hours: 10, color: "#06b6d4", emoji: "🇪🇸", streak: 5, nextLevel: "Intermediate", pointsToNext: 480 },
  { name: "UI Design", level: "Advanced", progress: 82, sessions: 16, hours: 24, color: "#7c3aed", emoji: "🎨", streak: 20, nextLevel: "Expert", pointsToNext: 150 },
  { name: "React", level: "Intermediate", progress: 58, sessions: 7, hours: 11, color: "#10b981", emoji: "⚛️", streak: 3, nextLevel: "Advanced", pointsToNext: 390 },
];

const weekData = [
  { day: "Mon", Python: 1.5, Spanish: 0.5, Design: 2 },
  { day: "Tue", Python: 2, Spanish: 1, Design: 1.5 },
  { day: "Wed", Python: 0, Spanish: 0.5, Design: 3 },
  { day: "Thu", Python: 3, Spanish: 0, Design: 2 },
  { day: "Fri", Python: 2, Spanish: 1.5, Design: 1 },
  { day: "Sat", Python: 4, Spanish: 2, Design: 3.5 },
  { day: "Sun", Python: 1.5, Spanish: 1, Design: 2 },
];

const radarData = [
  { skill: "Python", value: 67 },
  { skill: "Spanish", value: 45 },
  { skill: "Design", value: 82 },
  { skill: "React", value: 58 },
  { skill: "Soft Skills", value: 72 },
  { skill: "Eng Writing", value: 65 },
];

const monthlyData = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  hours: [4, 6, 8, 12, 15, 18, 0, 0, 0, 0, 0, 0][i],
})).filter(d => d.hours > 0);

export function SkillProgressView() {
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Hours", value: "63h", icon: Clock, color: "#4338ca" },
          { label: "Current Streak", value: "12 days", icon: Flame, color: "#f59e0b" },
          { label: "Sessions Done", value: "43", icon: BookOpen, color: "#7c3aed" },
          { label: "Points Earned", value: "2,450", icon: Zap, color: "#06b6d4" },
        ].map(stat => (
          <div key={stat.label} className="p-5 rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}14` }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Skill cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SKILLS.map((skill, i) => (
          <motion.div key={skill.name}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${skill.color}14` }}>
                {skill.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-foreground">{skill.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: skill.color }}>{skill.level}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{skill.sessions} sessions</span>
                  <span>{skill.hours}h total</span>
                  <span className="flex items-center gap-0.5 text-orange-500 font-medium">
                    <Flame size={11} /> {skill.streak} streak
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress to {skill.nextLevel}</span>
                <span className="font-bold" style={{ color: skill.color }}>{skill.progress}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                <motion.div className="h-full rounded-full"
                  style={{ background: skill.color }}
                  initial={{ width: 0 }} animate={{ width: `${skill.progress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{skill.pointsToNext} pts to {skill.nextLevel}</div>
            </div>

            {/* Level indicators */}
            <div className="flex items-center gap-1 mt-3">
              {["Beginner", "Intermediate", "Advanced", "Expert"].map((level, li) => {
                const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
                const currentIndex = levels.indexOf(skill.level);
                const isActive = li <= currentIndex;
                return (
                  <div key={level} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-1.5 w-full rounded-full transition-all ${isActive ? "" : "bg-muted"}`}
                      style={isActive ? { background: skill.color } : {}} />
                    <span className="text-xs text-muted-foreground" style={{ fontSize: 9 }}>{level.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-bold text-foreground mb-4">Weekly Learning Hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="Python" stackId="a" fill="#4338ca" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Spanish" stackId="a" fill="#06b6d4" />
              <Bar dataKey="Design" stackId="a" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[{ label: "Python", color: "#4338ca" }, { label: "Spanish", color: "#06b6d4" }, { label: "Design", color: "#7c3aed" }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill radar */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-bold text-foreground mb-4">Skill Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Radar name="Skills" dataKey="value" stroke="#4338ca" fill="#4338ca" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly learning journey */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Learning Journey 2026</h3>
          <span className="text-xs text-muted-foreground">Total: 63 hours this year</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: -30 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
            <Line type="monotone" dataKey="hours" stroke="#4338ca" strokeWidth={2.5} dot={{ fill: "#4338ca", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily goal */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          <Target size={18} className="text-primary" />
          <h3 className="font-bold text-foreground">Today's Learning Goal</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { goal: "Complete 1 Python exercise", done: true, points: 50 },
            { goal: "Review Spanish vocabulary (20 words)", done: false, points: 30 },
            { goal: "Watch 1 Design tutorial", done: false, points: 40 },
          ].map(item => (
            <div key={item.goal} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.done ? "bg-green-500/10 border-green-500/20" : "bg-card border-border"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-500" : "border-2 border-border"}`}>
                {item.done && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${item.done ? "text-green-700 line-through" : "text-foreground"}`}>{item.goal}</div>
                <div className="text-xs text-muted-foreground">+{item.points} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
