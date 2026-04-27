import { create } from "zustand";
import type { Patient, Task, Filters, OptimisticUpdate, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from "../types";
import * as api from "../api/client";

interface TaskboardState {
  // Data
  patients: Patient[];
  tasks: Record<string, Task[]>; // keyed by patientId
  optimisticUpdates: Record<string, OptimisticUpdate>; // keyed by taskId

  // UI State
  filters: Filters;
  loading: { patients: boolean; tasks: Record<string, boolean> };
  errors: { patients: string | null; tasks: Record<string, string | null>; mutations: Record<string, string | null> };

  // Actions
  loadPatients: () => Promise<void>;
  loadTasksForPatient: (patientId: string) => Promise<void>;
  createTask: (patientId: string, payload: CreateTaskPayload) => Promise<void>;
  updateTaskStatus: (taskId: string, patientId: string, status: TaskStatus) => Promise<void>;
  updateTask: (taskId: string, patientId: string, payload: UpdateTaskPayload) => Promise<void>;
  setFilters: (filters: Partial<Filters>) => void;
  clearMutationError: (taskId: string) => void;
}

export const useTaskboardStore = create<TaskboardState>((set, get) => ({
  patients: [],
  tasks: {},
  optimisticUpdates: {},
  filters: { role: "all", time: "all", search: "" },
  loading: { patients: false, tasks: {} },
  errors: { patients: null, tasks: {}, mutations: {} },

  // ── Load patients ──────────────────────────────────────────────────────────
  loadPatients: async () => {
    set((s) => ({ loading: { ...s.loading, patients: true }, errors: { ...s.errors, patients: null } }));
    try {
      const patients = await api.fetchPatients();
      set((s) => ({ patients, loading: { ...s.loading, patients: false } }));
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, patients: false },
        errors: { ...s.errors, patients: err instanceof Error ? err.message : "Failed to load patients" },
      }));
    }
  },

  // ── Load tasks for one patient ─────────────────────────────────────────────
  loadTasksForPatient: async (patientId: string) => {
    set((s) => ({
      loading: { ...s.loading, tasks: { ...s.loading.tasks, [patientId]: true } },
      errors: { ...s.errors, tasks: { ...s.errors.tasks, [patientId]: null } },
    }));
    try {
      const tasks = await api.fetchTasksForPatient(patientId);
      set((s) => ({
        tasks: { ...s.tasks, [patientId]: tasks },
        loading: { ...s.loading, tasks: { ...s.loading.tasks, [patientId]: false } },
      }));
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, tasks: { ...s.loading.tasks, [patientId]: false } },
        errors: {
          ...s.errors,
          tasks: { ...s.errors.tasks, [patientId]: err instanceof Error ? err.message : "Failed to load tasks" },
        },
      }));
    }
  },

  // ── Create task ────────────────────────────────────────────────────────────
  createTask: async (patientId: string, payload: CreateTaskPayload) => {
    try {
      const newTask = await api.createTask(patientId, payload);
      set((s) => ({
        tasks: {
          ...s.tasks,
          [patientId]: [newTask, ...(s.tasks[patientId] ?? [])],
        },
      }));
    } catch (err) {
      // Surface as a general tasks error for the patient row
      set((s) => ({
        errors: {
          ...s.errors,
          tasks: {
            ...s.errors.tasks,
            [patientId]: err instanceof Error ? err.message : "Failed to create task",
          },
        },
      }));
      throw err;
    }
  },

  // ── Update task status (optimistic) ───────────────────────────────────────
  updateTaskStatus: async (taskId: string, patientId: string, status: TaskStatus) => {
    return get().updateTask(taskId, patientId, { status });
  },

  // ── Update task (optimistic) ──────────────────────────────────────────────
  updateTask: async (taskId: string, patientId: string, payload: UpdateTaskPayload) => {
    const currentTasks = get().tasks[patientId] ?? [];
    const previousTask = currentTasks.find((t) => t.id === taskId);
    if (!previousTask) return;

    // 1. Apply optimistic update immediately
    const optimisticTask = { ...previousTask, ...payload };
    set((s) => ({
      tasks: {
        ...s.tasks,
        [patientId]: s.tasks[patientId].map((t) => (t.id === taskId ? optimisticTask : t)),
      },
      optimisticUpdates: {
        ...s.optimisticUpdates,
        [taskId]: { taskId, previousTask, pending: true },
      },
      errors: {
        ...s.errors,
        mutations: { ...s.errors.mutations, [taskId]: null },
      },
    }));

    try {
      const updatedTask = await api.updateTask(taskId, payload);
      // 2. Replace optimistic with real server response
      set((s) => ({
        tasks: {
          ...s.tasks,
          [patientId]: s.tasks[patientId].map((t) => (t.id === taskId ? updatedTask : t)),
        },
        optimisticUpdates: Object.fromEntries(
          Object.entries(s.optimisticUpdates).filter(([k]) => k !== taskId)
        ),
      }));
    } catch (err) {
      // 3. Rollback to previous state
      set((s) => ({
        tasks: {
          ...s.tasks,
          [patientId]: s.tasks[patientId].map((t) => (t.id === taskId ? previousTask : t)),
        },
        optimisticUpdates: Object.fromEntries(
          Object.entries(s.optimisticUpdates).filter(([k]) => k !== taskId)
        ),
        errors: {
          ...s.errors,
          mutations: {
            ...s.errors.mutations,
            [taskId]: err instanceof Error ? err.message : "Update failed",
          },
        },
      }));
    }
  },

  // ── Filters ────────────────────────────────────────────────────────────────
  setFilters: (filters: Partial<Filters>) => {
    set((s) => ({ filters: { ...s.filters, ...filters } }));
  },

  clearMutationError: (taskId: string) => {
    set((s) => ({
      errors: {
        ...s.errors,
        mutations: Object.fromEntries(
          Object.entries(s.errors.mutations).filter(([k]) => k !== taskId)
        ),
      },
    }));
  },
}));

// ─── Selector helpers (memoized via shallow compare in components) ─────────────

export function selectFilteredTasks(
  tasks: Task[],
  filters: Filters
): Task[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return tasks.filter((task) => {
    if (filters.role !== "all" && task.assigneeRole !== filters.role) return false;

    if (filters.time !== "all") {
      const due = task.dueDate.slice(0, 10);
      if (filters.time === "overdue" && (task.status === "completed" || due >= todayStr)) return false;
      if (filters.time === "due_today" && due !== todayStr) return false;
      if (filters.time === "upcoming" && due <= todayStr) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(q) && !task.assigneeName?.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}