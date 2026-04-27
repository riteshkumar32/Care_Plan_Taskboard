export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";

export type TaskCategory =
  | "monthly_labs"
  | "access_check"
  | "diet_counselling"
  | "vaccination"
  | "social_work"
  | "medication_review"
  | "other";

export type StaffRole = "nurse" | "dietician" | "social_worker";

export interface Patient {
  id: string;
  name: string;
  mrn: string;
  dialysisType?: "hemodialysis" | "peritoneal";
  ward?: string;
}

export interface Task {
  id: string;
  patientId: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  assigneeRole: StaffRole;
  assigneeId?: string;
  assigneeName?: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientDTO {
  id: string;
  name: string;
  mrn: string;
  dialysis_type?: string;
  ward?: string;
}

export interface TaskDTO {
  id: string;
  patient_id: string;
  title: string;
  category?: string;
  status: string;
  assignee_role: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateTaskPayload {
  title: string;
  category: TaskCategory;
  assigneeRole: StaffRole;
  dueDate: string;
  notes?: string;
}

export interface UpdateTaskPayload {
  status?: TaskStatus;
  assigneeRole?: StaffRole;
  assigneeId?: string;
  dueDate?: string;
  notes?: string;
}

export type TimeFilter = "all" | "overdue" | "due_today" | "upcoming";

export interface Filters {
  role: StaffRole | "all";
  time: TimeFilter;
  search: string;
}

export interface OptimisticUpdate {
  taskId: string;
  previousTask: Task;
  pending: boolean;
  error?: string;
}