// Tests for useUpdateTask hook — covers optimistic update + server error rollback.
// Run with: npx vitest (or jest with appropriate transforms)

import { renderHook, act, waitFor } from "@testing-library/react";
import { useUpdateTask } from "../hooks/useTasks";
import { useTaskboardStore } from "../store/taskboardStore";
import type { Task } from "../types";

// ─── Shared mock task ──────────────────────────────────────────────────────────

const mockTask: Task = {
  id: "t1",
  patientId: "p1",
  title: "Monthly labs",
  category: "monthly_labs",
  status: "pending",
  assigneeRole: "nurse",
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

function seedStore(tasks: Task[]) {
  useTaskboardStore.setState({
    tasks: { p1: tasks },
    optimisticUpdates: {},
    errors: { patients: null, tasks: {}, mutations: {} },
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("useUpdateTask", () => {
  beforeEach(() => {
    seedStore([mockTask]);
  });

  test("hook is defined and returns expected functions", () => {
    const { result } = renderHook(() => useUpdateTask());
    expect(result.current.updateTask).toBeDefined();
    expect(result.current.updateTaskStatus).toBeDefined();
    expect(result.current.isPending).toBeDefined();
    expect(result.current.getError).toBeDefined();
    expect(result.current.clearError).toBeDefined();
  });

  test("optimistic update applies immediately before API resolves", async () => {
    let resolveUpdate!: (v: Task) => void;
    const pendingPromise = new Promise<Task>((res) => { resolveUpdate = res; });

    // Spy on updateTask in the store
    const spy = vi.spyOn(useTaskboardStore.getState(), "updateTask").mockImplementation(
      async (taskId: string, patientId: string) => {
        // Apply optimistic update to store before resolving
        useTaskboardStore.setState((s) => ({
          tasks: {
            ...s.tasks,
            p1: s.tasks.p1.map((t) =>
              t.id === taskId ? { ...t, status: "in_progress" } : t
            ),
          },
          optimisticUpdates: {
            ...s.optimisticUpdates,
            [taskId]: { taskId, previousTask: mockTask, pending: true },
          },
        }));
        await pendingPromise;
      }
    );

    const { result } = renderHook(() => useUpdateTask());

    act(() => {
      result.current.updateTask("t1", "p1", { status: "in_progress" });
    });

    // Optimistic state should be applied immediately
    const store = useTaskboardStore.getState();
    const updated = store.tasks["p1"].find((t) => t.id === "t1");
    expect(updated?.status).toBe("in_progress");
    expect(result.current.isPending("t1")).toBe(true);

    // Resolve the API call
    resolveUpdate({ ...mockTask, status: "in_progress" });
    spy.mockRestore();
  });

  test("rolls back task to previous state on server error", async () => {
    // Directly test store's updateTask with a mocked api.updateTask
    const apiModule = await import("../api/client");
    const updateSpy = vi.spyOn(apiModule, "updateTask").mockRejectedValueOnce(
      new Error("Server error 500")
    );

    seedStore([mockTask]);

    await act(async () => {
      await useTaskboardStore.getState().updateTask("t1", "p1", { status: "completed" });
    });

    // Task should be rolled back to original pending status
    const state = useTaskboardStore.getState();
    const task = state.tasks["p1"].find((t) => t.id === "t1");
    expect(task?.status).toBe("pending");

    // Error should be stored
    expect(state.errors.mutations["t1"]).toBe("Server error 500");

    updateSpy.mockRestore();
  });

  test("clearError removes mutation error for task", async () => {
    // Seed an error in the store
    useTaskboardStore.setState((s) => ({
      errors: { ...s.errors, mutations: { t1: "Update failed" } },
    }));

    const { result } = renderHook(() => useUpdateTask());
    expect(result.current.getError("t1")).toBe("Update failed");

    act(() => {
      result.current.clearError("t1");
    });

    expect(result.current.getError("t1")).toBeNull();
  });

  test("isPending returns false once update completes", async () => {
    const apiModule = await import("../api/client");
    const updateSpy = vi.spyOn(apiModule, "updateTask").mockResolvedValueOnce({
      ...mockTask,
      status: "in_progress",
    });

    const { result } = renderHook(() => useUpdateTask());

    await act(async () => {
      await useTaskboardStore.getState().updateTask("t1", "p1", { status: "in_progress" });
    });

    await waitFor(() => {
      expect(result.current.isPending("t1")).toBe(false);
    });

    updateSpy.mockRestore();
  });
});

// ─── selectFilteredTasks unit tests ───────────────────────────────────────────

import { selectFilteredTasks } from "../store/taskboardStore";

describe("selectFilteredTasks", () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString();

  const tasks: Task[] = [
    { ...mockTask, id: "t1", assigneeRole: "nurse", dueDate: yesterday, status: "overdue" },
    { ...mockTask, id: "t2", assigneeRole: "dietician", dueDate: now.toISOString(), status: "pending" },
    { ...mockTask, id: "t3", assigneeRole: "social_worker", dueDate: tomorrow, status: "pending" },
  ];

  test("role filter: nurse only", () => {
    const result = selectFilteredTasks(tasks, { role: "nurse", time: "all", search: "" });
    expect(result.every((t) => t.assigneeRole === "nurse")).toBe(true);
  });

  test("time filter: upcoming excludes past/today", () => {
    const result = selectFilteredTasks(tasks, { role: "all", time: "upcoming", search: "" });
    expect(result.every((t) => new Date(t.dueDate) > new Date(new Date().toDateString()))).toBe(true);
  });

  test("search filter: matches title", () => {
    const searchTasks: Task[] = [
      { ...mockTask, id: "t1", title: "Monthly labs", assigneeRole: "nurse" },
      { ...mockTask, id: "t2", title: "Diet assessment", assigneeRole: "dietician" },
    ];
    const result = selectFilteredTasks(searchTasks, { role: "all", time: "all", search: "diet" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t2");
  });

  test("all filters: returns all tasks when defaults", () => {
    const result = selectFilteredTasks(tasks, { role: "all", time: "all", search: "" });
    expect(result).toHaveLength(3);
  });
});