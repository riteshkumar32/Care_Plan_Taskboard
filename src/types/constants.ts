import type { StaffRole, TaskCategory, TaskStatus } from "../types";

export const ROLE_LABELS: Record<StaffRole, string> = {
  nurse: "Nurse",
  dietician: "Dietician",
  social_worker: "Social Worker",
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  nurse: "#3b82f6",
  dietician: "#10b981",
  social_worker: "#f59e0b",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  monthly_labs: "Monthly Labs",
  access_check: "Access Check",
  diet_counselling: "Diet Counselling",
  vaccination: "Vaccination",
  social_work: "Social Work",
  medication_review: "Medication Review",
  other: "Other",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "#6b7280",
  in_progress: "#3b82f6",
  completed: "#10b981",
  overdue: "#ef4444",
};

export const API_BASE = "/api";
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;