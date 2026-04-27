// ─── Custom Hooks ─────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useTaskboardStore, selectFilteredTasks } from "../store/taskboardStore";
import type { Task } from "../types";

/**
 * Loads patients once on mount. Returns patients + loading/error state.
 */
export function usePatients() {
  const patients = useTaskboardStore((s) => s.patients);
  const loading = useTaskboardStore((s) => s.loading.patients);
  const error = useTaskboardStore((s) => s.errors.patients);
  const loadPatients = useTaskboardStore((s) => s.loadPatients);

  useEffect(() => {
    if (patients.length === 0) {
      loadPatients();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { patients, loading, error, reload: loadPatients };
}

/**
 * Loads tasks for a given patient, applies current filters.
 */
export function usePatientTasks(patientId: string): {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const allTasks = useTaskboardStore((s) => s.tasks[patientId] ?? []);
  const filters = useTaskboardStore((s) => s.filters);
  const loading = useTaskboardStore((s) => s.loading.tasks[patientId] ?? false);
  const error = useTaskboardStore((s) => s.errors.tasks[patientId] ?? null);
  const loadTasksForPatient = useTaskboardStore((s) => s.loadTasksForPatient);

  useEffect(() => {
    loadTasksForPatient(patientId);
  }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tasks = selectFilteredTasks(allTasks, filters);
  return { tasks, loading, error, reload: () => loadTasksForPatient(patientId) };
}

/**
 * Returns the update function + per-task error/pending state.
 */
export function useUpdateTask() {
  const updateTask = useTaskboardStore((s) => s.updateTask);
  const updateTaskStatus = useTaskboardStore((s) => s.updateTaskStatus);
  const optimisticUpdates = useTaskboardStore((s) => s.optimisticUpdates);
  const mutationErrors = useTaskboardStore((s) => s.errors.mutations);
  const clearMutationError = useTaskboardStore((s) => s.clearMutationError);

  return {
    updateTask,
    updateTaskStatus,
    isPending: (taskId: string) => optimisticUpdates[taskId]?.pending ?? false,
    getError: (taskId: string) => mutationErrors[taskId] ?? null,
    clearError: clearMutationError,
  };
}

/**
 * Returns create task action + per-patient error.
 */
export function useCreateTask(patientId: string) {
  const createTask = useTaskboardStore((s) => s.createTask);
  const error = useTaskboardStore((s) => s.errors.tasks[patientId] ?? null);

  return {
    createTask: (payload: Parameters<typeof createTask>[1]) =>
      createTask(patientId, payload),
    error,
  };
}

export function useFilters() {
  const filters = useTaskboardStore((s) => s.filters);
  const setFilters = useTaskboardStore((s) => s.setFilters);
  return { filters, setFilters };
}