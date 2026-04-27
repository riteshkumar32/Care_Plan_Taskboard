import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskCard } from "../components/TaskCard";
import { useTaskboardStore } from "../store/taskboardStore";
import type { Task } from "../types";

const task: Task = {
  id: "t1",
  patientId: "p1",
  title: "Fistula inspection",
  category: "access_check",
  status: "pending",
  assigneeRole: "nurse",
  assigneeName: "Nurse Sharma",
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  useTaskboardStore.setState({
    tasks: { p1: [task] },
    optimisticUpdates: {},
    errors: { patients: null, tasks: {}, mutations: {} },
  });
});

describe("TaskCard", () => {
  test("renders task title and assignee", () => {
    render(<TaskCard task={task} patientId="p1" />);
    expect(screen.getByText("Fistula inspection")).toBeInTheDocument();
    expect(screen.getByText(/Nurse Sharma/)).toBeInTheDocument();
  });

  test("renders status select with current value", () => {
    render(<TaskCard task={task} patientId="p1" />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("pending");
  });

  test("shows 'saving…' while optimistic update is pending", () => {
    useTaskboardStore.setState((s) => ({
      optimisticUpdates: {
        t1: { taskId: "t1", previousTask: task, pending: true },
      },
    }));

    render(<TaskCard task={{ ...task, status: "in_progress" }} patientId="p1" />);
    expect(screen.getByText("saving…")).toBeInTheDocument();
  });

  test("shows error banner on mutation failure", () => {
    useTaskboardStore.setState((s) => ({
      errors: { ...s.errors, mutations: { t1: "Update failed — changes rolled back." } },
    }));

    render(<TaskCard task={task} patientId="p1" />);
    expect(screen.getByText(/Update failed/)).toBeInTheDocument();
  });

  test("clears error when dismiss button is clicked", async () => {
    useTaskboardStore.setState((s) => ({
      errors: { ...s.errors, mutations: { t1: "Update failed — changes rolled back." } },
    }));

    render(<TaskCard task={task} patientId="p1" />);
    const dismissBtn = screen.getByRole("button");
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      const state = useTaskboardStore.getState();
      expect(state.errors.mutations["t1"]).toBeUndefined();
    });
  });

  test("select is disabled while pending", () => {
    useTaskboardStore.setState((s) => ({
      optimisticUpdates: {
        t1: { taskId: "t1", previousTask: task, pending: true },
      },
    }));

    render(<TaskCard task={task} patientId="p1" />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });
});
