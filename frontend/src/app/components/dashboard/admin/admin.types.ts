export type AdminMetricId =
  | "users"
  | "pendingProfiles"
  | "activeMatches"
  | "scheduledSessions"
  | "reports"
  | "averageRating";

export type AdminMetric = {
  id: AdminMetricId;
  label: string;
  value: string;
  helper: string;
  color: string;
};

export type ProfileApprovalStatus = "pending" | "approved" | "rejected";

export type PendingProfile = {
  id: string;
  name: string;
  department: string;
  grade: string;
  teaches: string;
  learns: string;
  status: ProfileApprovalStatus;
};

export type ReportPriority = "low" | "medium" | "high";
export type ReportStatus = "new" | "reviewing" | "resolved";

export type ModerationReport = {
  id: string;
  reportedUser: string;
  reason: string;
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: string;
};

export type AdminFeedback = {
  id: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  comment: string;
  date: string;
};

export type ActivityType =
  | "user_registered"
  | "match_created"
  | "session_scheduled"
  | "feedback_submitted"
  | "report_created";

export type PlatformActivity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
};
