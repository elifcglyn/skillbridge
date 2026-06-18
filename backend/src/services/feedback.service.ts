import { getPrismaClient } from "../lib/prisma.js";
import { createNotificationSafely } from "./notifications.service.js";

type ReviewRole = "mentor" | "learner";

type ReviewRow = {
  id: string;
  session_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  skill_name: string | null;
  reviewer_id: string;
  reviewer_full_name: string | null;
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
  reviewer_avatar_url: string | null;
  reviewer_role: ReviewRole;
  reviewed_as: ReviewRole;
};

type PendingSessionRow = {
  id: string;
  title: string | null;
  skill_name: string | null;
  scheduled_at: Date;
  mentor_id: string;
  learner_id: string | null;
  student_id: string | null;
  peer_id: string;
  peer_full_name: string | null;
  peer_first_name: string | null;
  peer_last_name: string | null;
  peer_avatar_url: string | null;
  reviewer_role: ReviewRole;
};

type SessionForReviewRow = {
  id: string;
  title: string | null;
  skill_name: string | null;
  status: string | null;
  mentor_id: string | null;
  learner_id: string | null;
  student_id: string | null;
};

type QueryExecutor = Pick<
  ReturnType<typeof getPrismaClient>,
  "$queryRaw" | "$executeRaw"
>;

export class FeedbackActionError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "SESSION_NOT_COMPLETED"
      | "ALREADY_REVIEWED"
      | "INVALID_REVIEW",
    message: string,
  ) {
    super(message);
  }
}

function profileName(row: {
  reviewer_full_name?: string | null;
  reviewer_first_name?: string | null;
  reviewer_last_name?: string | null;
  peer_full_name?: string | null;
  peer_first_name?: string | null;
  peer_last_name?: string | null;
}) {
  return (
    row.reviewer_full_name?.trim()
    || [row.reviewer_first_name, row.reviewer_last_name]
      .filter(Boolean)
      .join(" ")
      .trim()
    || row.peer_full_name?.trim()
    || [row.peer_first_name, row.peer_last_name]
      .filter(Boolean)
      .join(" ")
      .trim()
    || "SkillBridge Kullanıcısı"
  );
}

function normalizeReview(row: ReviewRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    rating: row.rating,
    comment: row.comment?.trim() ?? "",
    createdAt: row.created_at,
    skillName: row.skill_name?.trim() || "Beceri paylaşımı",
    reviewer: {
      id: row.reviewer_id,
      name: profileName(row),
      avatarUrl: row.reviewer_avatar_url,
      role: row.reviewer_role,
    },
    reviewedAs: row.reviewed_as,
  };
}

function normalizePendingSession(row: PendingSessionRow) {
  return {
    id: row.id,
    title: row.title?.trim() || row.skill_name?.trim() || "Görüşme",
    skillName: row.skill_name?.trim() || "Beceri paylaşımı",
    scheduledAt: row.scheduled_at,
    reviewerRole: row.reviewer_role,
    peer: {
      id: row.peer_id,
      name: profileName(row),
      avatarUrl: row.peer_avatar_url,
    },
  };
}

async function queryReceivedReviews(
  executor: QueryExecutor,
  userId: string,
  reviewId?: string,
) {
  return executor.$queryRaw<ReviewRow[]>`
    SELECT
      reviews.id,
      reviews.session_id,
      reviews.rating,
      reviews.comment,
      reviews.created_at,
      sessions.skill_name,
      reviews.reviewer_id,
      reviewer.full_name AS reviewer_full_name,
      reviewer.first_name AS reviewer_first_name,
      reviewer.last_name AS reviewer_last_name,
      reviewer.avatar_url AS reviewer_avatar_url,
      CASE
        WHEN sessions.mentor_id = reviews.reviewer_id THEN 'mentor'
        ELSE 'learner'
      END AS reviewer_role,
      CASE
        WHEN sessions.mentor_id::text = ${userId} THEN 'mentor'
        ELSE 'learner'
      END AS reviewed_as
    FROM public.reviews
    JOIN public.sessions ON sessions.id = reviews.session_id
    JOIN public.profiles AS reviewer ON reviewer.id = reviews.reviewer_id
    WHERE reviews.reviewee_id::text = ${userId}
      AND (${reviewId ?? null}::text IS NULL OR reviews.id::text = ${reviewId ?? null})
    ORDER BY reviews.created_at DESC;
  `;
}

async function queryPendingSessions(
  executor: QueryExecutor,
  userId: string,
) {
  return executor.$queryRaw<PendingSessionRow[]>`
    SELECT
      sessions.id,
      sessions.title,
      sessions.skill_name,
      sessions.scheduled_at,
      sessions.mentor_id,
      sessions.learner_id,
      sessions.student_id,
      peer.id AS peer_id,
      peer.full_name AS peer_full_name,
      peer.first_name AS peer_first_name,
      peer.last_name AS peer_last_name,
      peer.avatar_url AS peer_avatar_url,
      CASE
        WHEN sessions.mentor_id::text = ${userId} THEN 'mentor'
        ELSE 'learner'
      END AS reviewer_role
    FROM public.sessions
    JOIN public.profiles AS peer
      ON peer.id = CASE
        WHEN sessions.mentor_id::text = ${userId}
          THEN coalesce(sessions.learner_id, sessions.student_id)
        ELSE sessions.mentor_id
      END
    WHERE lower(coalesce(sessions.status, 'scheduled')) = 'completed'
      AND (
        sessions.mentor_id::text = ${userId}
        OR sessions.learner_id::text = ${userId}
        OR sessions.student_id::text = ${userId}
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.reviews
        WHERE reviews.session_id = sessions.id
          AND reviews.reviewer_id::text = ${userId}
      )
    ORDER BY sessions.scheduled_at DESC
    ;
  `;
}

export async function getFeedbackOverview(userId: string) {
  const prisma = getPrismaClient();
  const [reviewRows, pendingRows] = await Promise.all([
    queryReceivedReviews(prisma, userId),
    queryPendingSessions(prisma, userId),
  ]);
  const reviews = reviewRows.map(normalizeReview);
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;
  const positiveReviews = reviews.filter((review) => review.rating >= 4).length;
  const breakdown = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));

  return {
    summary: {
      averageRating: Number(averageRating.toFixed(1)),
      trustScore: Number((averageRating * 2).toFixed(1)),
      totalReviews,
      positivePercentage: totalReviews
        ? Math.round((positiveReviews / totalReviews) * 100)
        : 0,
    },
    breakdown,
    reviews,
    pendingSessions: pendingRows.map(normalizePendingSession),
  };
}

export async function createFeedback(params: {
  userId: string;
  sessionId: string;
  rating: number;
  comment: string;
}) {
  if (!Number.isInteger(params.rating) || params.rating < 1 || params.rating > 5) {
    throw new FeedbackActionError(
      "INVALID_REVIEW",
      "Puan 1 ile 5 arasında bir tam sayı olmalıdır.",
    );
  }

  const comment = params.comment.trim();
  if (comment.length > 1000) {
    throw new FeedbackActionError(
      "INVALID_REVIEW",
      "Yorum en fazla 1000 karakter olabilir.",
    );
  }

  const prisma = getPrismaClient();
  const created = await prisma.$transaction(async (transaction) => {
    const executor = transaction as QueryExecutor;
    const sessions = await executor.$queryRaw<SessionForReviewRow[]>`
      SELECT
        id,
        title,
        skill_name,
        status,
        mentor_id,
        learner_id,
        student_id
      FROM public.sessions
      WHERE id::text = ${params.sessionId}
      FOR UPDATE;
    `;
    const session = sessions[0];

    if (!session) {
      throw new FeedbackActionError("NOT_FOUND", "Görüşme bulunamadı.");
    }
    if (String(session.status ?? "").toLowerCase() !== "completed") {
      throw new FeedbackActionError(
        "SESSION_NOT_COMPLETED",
        "Yalnızca tamamlanmış görüşmeler değerlendirilebilir.",
      );
    }

    const learnerId = session.learner_id ?? session.student_id;
    const isMentor = session.mentor_id === params.userId;
    const isLearner = learnerId === params.userId;
    if (!isMentor && !isLearner) {
      throw new FeedbackActionError(
        "FORBIDDEN",
        "Bu görüşmeyi değerlendirme yetkiniz yok.",
      );
    }

    const revieweeId = isMentor ? learnerId : session.mentor_id;
    if (!revieweeId || revieweeId === params.userId) {
      throw new FeedbackActionError(
        "INVALID_REVIEW",
        "Değerlendirilecek kullanıcı belirlenemedi.",
      );
    }

    const rows = await executor.$queryRaw<{ id: string }[]>`
      INSERT INTO public.reviews (
        session_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment
      )
      VALUES (
        ${params.sessionId}::uuid,
        ${params.userId}::uuid,
        ${revieweeId}::uuid,
        ${params.rating},
        ${comment}
      )
      ON CONFLICT (session_id, reviewer_id) DO NOTHING
      RETURNING id;
    `;

    if (!rows[0]) {
      throw new FeedbackActionError(
        "ALREADY_REVIEWED",
        "Bu görüşme için daha önce değerlendirme gönderdiniz.",
      );
    }

    return {
      reviewId: rows[0].id,
      revieweeId,
      sessionTitle:
        session.title?.trim()
        || session.skill_name?.trim()
        || "Görüşme",
    };
  });

  await createNotificationSafely({
    userId: created.revieweeId,
    actorId: params.userId,
    type: "FEEDBACK",
    title: "Yeni değerlendirme aldınız",
    message: `${created.sessionTitle} için ${params.rating} yıldızlı yeni bir değerlendirme aldınız.`,
    metadata: {
      sessionId: params.sessionId,
      reviewId: created.reviewId,
      rating: params.rating,
      peerId: params.userId,
    },
    relatedUrl: "feedback",
  });

  return {
    id: created.reviewId,
    sessionId: params.sessionId,
    revieweeId: created.revieweeId,
    rating: params.rating,
    comment,
  };
}
