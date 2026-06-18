import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Shield,
  Star,
  ThumbsUp,
} from "lucide-react";
import {
  getFeedbackOverview,
  submitFeedback,
  type FeedbackOverview,
  type FeedbackRole,
  type PendingFeedbackSession,
} from "@/lib/feedback";
import { supabase } from "@/lib/supabase";

type FeedbackViewProps = {
  initialSessionId?: string | null;
  onFeedbackSubmitted?: () => void | Promise<void>;
};

type ReviewFilter = "all" | FeedbackRole;

export function FeedbackView({
  initialSessionId,
  onFeedbackSubmitted,
}: FeedbackViewProps) {
  const [overview, setOverview] = useState<FeedbackOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadFeedback = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      setOverview(await getFeedbackOverview());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Geri bildirim bilgileri yüklenemedi.",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();

    const channel = supabase
      .channel("feedback_view_reviews")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        () => void loadFeedback(false),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFeedback]);

  useEffect(() => {
    if (!initialSessionId || !overview) return;
    if (
      overview.pendingSessions.some(
        (session) => session.id === initialSessionId,
      )
    ) {
      setSelectedSessionId(initialSessionId);
    }
  }, [initialSessionId, overview]);

  const selectedSession = useMemo(
    () =>
      overview?.pendingSessions.find(
        (session) => session.id === selectedSessionId,
      ) ?? null,
    [overview, selectedSessionId],
  );

  const visibleReviews = useMemo(
    () =>
      (overview?.reviews ?? []).filter(
        (review) => filter === "all" || review.reviewedAs === filter,
      ),
    [filter, overview],
  );

  const handleSelectSession = (session: PendingFeedbackSession) => {
    setSelectedSessionId(session.id);
    setRating(0);
    setComment("");
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!selectedSession || rating < 1) {
      setError("Lütfen göndermeden önce 1 ile 5 arasında bir puan seçin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await submitFeedback({
        sessionId: selectedSession.id,
        rating,
        comment,
      });
      setSuccess(
        `${selectedSession.peer.name} için değerlendirmeniz kaydedildi.`,
      );
      setSelectedSessionId(null);
      setRating(0);
      setComment("");
      await Promise.all([
        loadFeedback(false),
        Promise.resolve(onFeedbackSubmitted?.()),
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Değerlendirme gönderilemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const summary = overview?.summary ?? {
    averageRating: 0,
    trustScore: 0,
    totalReviews: 0,
    positivePercentage: 0,
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 pb-24">
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadFeedback()}
            className="inline-flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} /> Yenile
          </button>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 flex items-center gap-2"
        >
          <CheckCircle2 size={18} className="text-emerald-500" />
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="sm:col-span-1 p-6 rounded-2xl border border-border bg-card text-center flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg, #eef2ff, #f3e8ff)" }}
        >
          <div
            className="text-5xl font-extrabold mb-1"
            style={{
              background: "var(--sb-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {loading ? "..." : summary.trustScore.toFixed(1)}
          </div>
          <div className="text-sm font-bold text-foreground mb-1">
            Güven Puanı
          </div>
          <div className="text-xs text-muted-foreground">
            {summary.totalReviews
              ? `${summary.totalReviews} gerçek değerlendirmeye göre`
              : "Henüz değerlendirme yok"}
          </div>
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                fill={
                  star <= Math.round(summary.averageRating)
                    ? "#f59e0b"
                    : "transparent"
                }
                color="#f59e0b"
              />
            ))}
          </div>
        </div>

        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Ortalama Puan",
              value: summary.averageRating.toFixed(1),
              icon: Star,
              color: "#f59e0b",
            },
            {
              label: "Toplam Yorum",
              value: summary.totalReviews,
              icon: MessageSquare,
              color: "#4338ca",
            },
            {
              label: "Olumlu Oran",
              value: `%${summary.positivePercentage}`,
              icon: ThumbsUp,
              color: "#10b981",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl border border-border bg-card text-center"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${stat.color}14` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-extrabold text-foreground">
                {loading ? "..." : stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <h3 className="font-bold text-foreground mb-4">Puan Dağılımı</h3>
        <div className="space-y-2.5">
          {(overview?.breakdown ?? [5, 4, 3, 2, 1].map((value) => ({
            rating: value,
            count: 0,
          }))).map((item) => {
            const percentage = summary.totalReviews
              ? (item.count / summary.totalReviews) * 100
              : 0;
            return (
              <div key={item.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-14 flex-shrink-0">
                  <span className="text-sm font-medium text-foreground">
                    {item.rating}
                  </span>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                </div>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-foreground">Aldığım Değerlendirmeler</h3>
          <div className="flex gap-2">
            {[
              { id: "all" as const, label: "Tümü" },
              { id: "mentor" as const, label: "Mentor Olarak" },
              { id: "learner" as const, label: "Öğrenci Olarak" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filter === item.id
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                style={
                  filter === item.id
                    ? { background: "var(--sb-gradient)" }
                    : undefined
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!loading && visibleReviews.length === 0 && (
            <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center text-sm text-muted-foreground">
              Bu filtrede henüz değerlendirme bulunmuyor.
            </div>
          )}
          {visibleReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {review.reviewer.avatarUrl ? (
                  <img
                    src={review.reviewer.avatarUrl}
                    alt={review.reviewer.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: "var(--sb-gradient)" }}
                  >
                    {review.reviewer.name.charAt(0).toLocaleUpperCase("tr-TR")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-bold text-foreground">
                        {review.reviewer.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {review.reviewer.role === "mentor" ? "Mentor" : "Öğrenci"}
                        {" · "}
                        {review.skillName}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= review.rating ? "#f59e0b" : "transparent"}
                          color="#f59e0b"
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      “{review.comment}”
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 mt-2 italic">
                      Yorum eklenmedi.
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(review.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-primary" />
          <h4 className="font-bold text-foreground">Değerlendirme Bırak</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {overview?.pendingSessions.length
            ? `${overview.pendingSessions.length} tamamlanmış görüşme değerlendirmenizi bekliyor.`
            : "Değerlendirme bekleyen tamamlanmış görüşmeniz yok."}
        </p>

        <div className="space-y-2">
          {(overview?.pendingSessions ?? []).map((session) => (
            <div
              key={session.id}
              className={`flex items-center gap-3 p-3 rounded-xl bg-card border ${
                selectedSessionId === session.id
                  ? "border-primary"
                  : "border-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground truncate">
                  {session.peer.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {session.title} ·{" "}
                  {new Date(session.scheduledAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectSession(session)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "var(--sb-gradient)" }}
              >
                Puanla
              </button>
            </div>
          ))}
        </div>

        {selectedSession && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 rounded-2xl border border-primary/30 bg-card"
          >
            <div className="font-bold text-foreground mb-1">
              {selectedSession.peer.name}
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              {selectedSession.skillName} görüşmesini değerlendiriyorsunuz.
            </div>

            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label={`${star} yıldız`}
                >
                  <Star
                    size={26}
                    fill={star <= rating ? "#f59e0b" : "transparent"}
                    color="#f59e0b"
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Deneyiminizi paylaşın (isteğe bağlı)"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none resize-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
            <div className="flex items-center justify-between gap-3 mt-3">
              <span className="text-[11px] text-muted-foreground">
                {comment.length}/1000
              </span>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || rating < 1}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ background: "var(--sb-gradient)" }}
              >
                {submitting ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
