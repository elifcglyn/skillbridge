import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, ThumbsUp, Shield, MessageSquare } from "lucide-react";
import { getSession, type SkillBridgeSession } from "@/lib/sessions";

const REVIEWS = [
  { id: 1, from: "Aria Chen", role: "Mentor", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop", rating: 5, comment: "Alex is one of the most dedicated students I've taught. He comes prepared, asks great questions, and implements feedback immediately. Highly recommend!", date: "June 2, 2026", skill: "Python" },
  { id: 2, from: "Zara Ahmed", role: "Mentor", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop", rating: 5, comment: "Excellent learner with a great eye for design. Alex picked up Figma concepts faster than most students. A pleasure to work with!", date: "May 28, 2026", skill: "UI Design" },
  { id: 3, from: "Tom Walker", role: "Learner", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop", rating: 5, comment: "Alex taught me React basics and was incredibly patient and clear. He broke down complex concepts really well. Highly recommend him as a mentor!", date: "May 20, 2026", skill: "React" },
  { id: 4, from: "Sofia M.", role: "Learner", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=60&h=60&fit=crop", rating: 4, comment: "Great Python sessions with Alex. Very knowledgeable and helpful. Looking forward to more sessions!", date: "May 12, 2026", skill: "Python" },
];

type FeedbackViewProps = {
  initialSessionId?: string | null;
};

export function FeedbackView({ initialSessionId }: FeedbackViewProps) {
  const [selectedSession, setSelectedSession] = useState<SkillBridgeSession | null>(null);

  useEffect(() => {
    if (!initialSessionId) {
      setSelectedSession(null);
      return;
    }

    let active = true;
    getSession(initialSessionId)
      .then((session) => {
        if (active) setSelectedSession(session);
      })
      .catch(() => {
        if (active) setSelectedSession(null);
      });

    return () => {
      active = false;
    };
  }, [initialSessionId]);

  const avgRating = (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Trust Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 p-6 rounded-2xl border border-border bg-card text-center flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg, #eef2ff, #f3e8ff)" }}>
          <div className="text-5xl font-extrabold mb-1" style={{ background: "var(--sb-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            9.2
          </div>
          <div className="text-sm font-bold text-foreground mb-1">Trust Score</div>
          <div className="text-xs text-muted-foreground">Top 15% of all users</div>
          <div className="flex items-center gap-1 mt-3">
            {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#f59e0b" color="#f59e0b" />)}
          </div>
        </div>

        <div className="sm:col-span-2 grid grid-cols-3 gap-4">
          {[
            { label: "Avg Rating", value: avgRating, suffix: "/ 5", icon: Star, color: "#f59e0b" },
            { label: "Total Reviews", value: REVIEWS.length, suffix: "reviews", icon: MessageSquare, color: "#4338ca" },
            { label: "Session Quality", value: "98%", suffix: "positive", icon: ThumbsUp, color: "#10b981" },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl border border-border bg-card text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${stat.color}14` }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h3 className="font-bold text-foreground mb-4">Rating Breakdown</h3>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = REVIEWS.filter(r => r.rating === stars).length;
            const pct = (count / REVIEWS.length) * 100;
            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-14 flex-shrink-0">
                  <span className="text-sm font-medium text-foreground">{stars}</span>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                </div>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-muted">
                  <motion.div className="h-full rounded-full bg-yellow-400"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">Reviews</h3>
          <div className="flex gap-2">
            {["All", "As Mentor", "As Learner"].map((f, i) => (
              <button key={f} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${i === 0 ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                style={i === 0 ? { background: "var(--sb-gradient)" } : {}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {REVIEWS.map((review, i) => (
            <motion.div key={review.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <img src={review.avatar} alt={review.from} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-bold text-foreground">{review.from}</div>
                      <div className="text-xs text-muted-foreground">{review.role} · {review.skill}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill={s <= review.rating ? "#f59e0b" : "transparent"} color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">"{review.comment}"</p>
                  <div className="text-xs text-muted-foreground/60 mt-2">{review.date}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending feedback */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary" />
          <h4 className="font-bold text-foreground">Leave Feedback</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">You have 2 sessions awaiting your feedback. Help build the community's trust!</p>
        <div className="space-y-2">
          {selectedSession && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-primary/30">
              <div className="flex-1">
                <span className="font-medium text-sm text-foreground">
                  {selectedSession.peer.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  · {selectedSession.title} ·{" "}
                  {new Date(selectedSession.scheduledAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--sb-gradient)" }}>
                Rate Now
              </button>
            </div>
          )}
          {[
            { name: "Aria Chen", skill: "Python Session", date: "June 4" },
            { name: "Priya Sharma", skill: "React Tutorial", date: "June 3" },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="flex-1">
                <span className="font-medium text-sm text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground ml-2">· {item.skill} · {item.date}</span>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--sb-gradient)" }}>
                Rate Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
