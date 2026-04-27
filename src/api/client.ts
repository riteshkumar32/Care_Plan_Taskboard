import type {
  Patient,
  PatientDTO,
  Task,
  TaskDTO,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
  TaskCategory,
  StaffRole,
} from "../types";
import { API_BASE, MAX_RETRIES, RETRY_DELAY_MS } from "../types/constants";

// ─── Normalization helpers ─────────────────────────────────────────────────

function isValidStatus(s: string): s is TaskStatus {
  return ["pending", "in_progress", "completed", "overdue"].includes(s);
}

function isValidCategory(s: string): s is TaskCategory {
  return [
    "monthly_labs",
    "access_check",
    "diet_counselling",
    "vaccination",
    "social_work",
    "medication_review",
    "other",
  ].includes(s);
}

function isValidRole(s: string): s is StaffRole {
  return ["nurse", "dietician", "social_worker"].includes(s);
}

export function normalizeTask(dto: TaskDTO): Task {
  return {
    id: dto.id,
    patientId: dto.patient_id,
    title: dto.title ?? "Untitled Task",
    category: isValidCategory(dto.category ?? "") ? (dto.category as TaskCategory) : "other",
    status: isValidStatus(dto.status) ? dto.status : "pending",
    assigneeRole: isValidRole(dto.assignee_role) ? dto.assignee_role : "nurse",
    assigneeId: dto.assignee_id,
    assigneeName: dto.assignee_name,
    dueDate: dto.due_date,
    notes: dto.notes,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function normalizePatient(dto: PatientDTO): Patient {
  const dialysisMap: Record<string, Patient["dialysisType"]> = {
    hemodialysis: "hemodialysis",
    peritoneal: "peritoneal",
  };
  return {
    id: dto.id,
    name: dto.name ?? "Unknown Patient",
    mrn: dto.mrn ?? "N/A",
    dialysisType: dialysisMap[dto.dialysis_type ?? ""] ?? undefined,
    ward: dto.ward,
  };
}


async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Only retry on 5xx or network errors, not 4xx
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
      lastError = new Error(`Server error: ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Network error");
    }

    if (attempt < retries) {
      await sleep(RETRY_DELAY_MS * Math.pow(2, attempt)); // exponential backoff
    }
  }

  throw lastError;
}

// ─── API functions ─────────────────────────────────────────────────────────

export async function fetchPatients(): Promise<Patient[]> {
  const res = await fetchWithRetry(`${API_BASE}/patients`);
  if (!res.ok) throw new Error("Failed to fetch patients");
  const data: PatientDTO[] = await res.json();
  return Array.isArray(data) ? data.map(normalizePatient) : [];
}

export async function fetchTasksForPatient(patientId: string): Promise<Task[]> {
  const res = await fetchWithRetry(`${API_BASE}/patients/${patientId}/tasks`);
  if (!res.ok) throw new Error(`Failed to fetch tasks for patient ${patientId}`);
  const data: TaskDTO[] = await res.json();
  return Array.isArray(data) ? data.map(normalizeTask) : [];
}

export async function createTask(
  patientId: string,
  payload: CreateTaskPayload
): Promise<Task> {
  const res = await fetchWithRetry(`${API_BASE}/patients/${patientId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      category: payload.category,
      assignee_role: payload.assigneeRole,
      due_date: payload.dueDate,
      notes: payload.notes,
    }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  const dto: TaskDTO = await res.json();
  return normalizeTask(dto);
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload
): Promise<Task> {
  const res = await fetchWithRetry(`${API_BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: payload.status,
      assignee_role: payload.assigneeRole,
      assignee_id: payload.assigneeId,
      due_date: payload.dueDate,
      notes: payload.notes,
    }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  const dto: TaskDTO = await res.json();
  return normalizeTask(dto);
}