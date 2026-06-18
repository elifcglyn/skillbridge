import { MessageSquare, Star } from "lucide-react";
import type { AdminFeedback } from "./admin.types";

export function RecentFeedbackSection({
  feedback,
}: {
  feedback: AdminFeedback[];
}) {
  return (
    <section className="p-5 rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10 text-pink-500">
          <MessageSquare size={18} />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Son Geri Bildirimler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Görüşme sonrası paylaşılan son değerlendirmeler.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {feedback.map((item) => (
          <div key={item.id} className="p-3 rounded-xl bg-muted/35 border border-border/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {item.reviewer}
                  <span className="font-normal text-muted-foreground"> → {item.reviewee}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  “{item.comment}”
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 flex-shrink-0">
                <Star size={13} fill="currentColor" /> {item.rating}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground/70 mt-2">{item.date}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
