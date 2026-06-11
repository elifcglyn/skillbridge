import { motion } from "motion/react";
import { Users, MessageSquare, Calendar, Award, Zap, Star, Bell, Check, X } from "lucide-react";

const NOTIFICATIONS = [
  { id: 1, type: "match", icon: Users, color: "#4338ca", title: "New Match!", desc: "Priya Sharma wants to learn Python from you. She teaches React!", time: "2 min ago", unread: true, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop" },
  { id: 2, type: "message", icon: MessageSquare, color: "#7c3aed", title: "Message from Aria", desc: "See you tomorrow at 3pm! Ready to deep dive into decorators 🐍", time: "8 min ago", unread: true, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" },
  { id: 3, type: "session", icon: Calendar, color: "#06b6d4", title: "Session Reminder", desc: "Your Python session with Aria Chen starts in 1 hour", time: "45 min ago", unread: true },
  { id: 4, type: "achievement", icon: Award, color: "#f59e0b", title: "Achievement Unlocked! 🏆", desc: "You earned the '7 Day Streak' badge. Keep it up!", time: "2h ago", unread: true },
  { id: 5, type: "match", icon: Users, color: "#4338ca", title: "New Match!", desc: "Tom Walker (Spanish Tutor) matched with your profile. 92% compatibility!", time: "3h ago", unread: false, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop" },
  { id: 6, type: "points", icon: Zap, color: "#10b981", title: "Skill Points Earned", desc: "You earned 180 points from your session with Aria Chen!", time: "1d ago", unread: false },
  { id: 7, type: "review", icon: Star, color: "#ec4899", title: "New Review", desc: "Aria Chen gave you 5 stars ⭐⭐⭐⭐⭐ — 'Excellent student, very engaged!'", time: "1d ago", unread: false },
  { id: 8, type: "suggestion", icon: Bell, color: "#6366f1", title: "Profile Suggestion", desc: "Add your availability to get 3x more match requests this week", time: "2d ago", unread: false },
];

export function NotificationsView() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">4 unread notifications</p>
        </div>
        <button className="text-sm text-primary font-medium hover:underline">Mark all read</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {["All", "Matches", "Messages", "Achievements", "Sessions"].map((f, i) => (
          <button key={f} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${i === 0 ? "text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            style={i === 0 ? { background: "var(--sb-gradient)" } : {}}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {NOTIFICATIONS.map((notif, i) => (
          <motion.div key={notif.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm cursor-pointer group ${notif.unread ? "border-primary/15 bg-primary/3" : "border-border bg-card"}`}>
            <div className="relative flex-shrink-0">
              {notif.avatar ? (
                <img src={notif.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${notif.color}14` }}>
                  <notif.icon size={20} style={{ color: notif.color }} />
                </div>
              )}
              {notif.unread && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card" style={{ background: notif.color }} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm text-foreground">{notif.title}</span>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notif.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{notif.time}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                      <Check size={11} />
                    </button>
                    <button className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {notif.type === "match" && (
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--sb-gradient)" }}>Accept</button>
                  <button className="px-3 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Decline</button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
