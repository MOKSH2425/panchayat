export type UserRole = "resident" | "secretary" | "chairman" | "builder";

export type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  flat_id: string | null;
  society_id: string;
  is_active: boolean;
};

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

export type NoticeCategory =
  | "general"
  | "emergency"
  | "meeting"
  | "event"
  | "payment";