import { apiGet, apiSend } from "./api";

export type FeedbackRole = "mentor" | "learner";

export type ReceivedReview = {
  id: string;
  sessionId: string;
  rating: number;
  comment: string;
  createdAt: string;
  skillName: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: FeedbackRole;
  };
  reviewedAs: FeedbackRole;
};

export type PendingFeedbackSession = {
  id: string;
  title: string;
  skillName: string;
  scheduledAt: string;
  reviewerRole: FeedbackRole;
  peer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type FeedbackOverview = {
  summary: {
    averageRating: number;
    trustScore: number;
    totalReviews: number;
    positivePercentage: number;
  };
  breakdown: {
    rating: number;
    count: number;
  }[];
  reviews: ReceivedReview[];
  pendingSessions: PendingFeedbackSession[];
};

export async function getFeedbackOverview() {
  const response = await apiGet<{ data: FeedbackOverview }>("/api/feedback");
  return response.data;
}

export async function submitFeedback(payload: {
  sessionId: string;
  rating: number;
  comment: string;
}) {
  const response = await apiSend<{
    data: {
      id: string;
      sessionId: string;
      revieweeId: string;
      rating: number;
      comment: string;
    };
  }>("/api/feedback", "POST", payload);
  return response.data;
}
