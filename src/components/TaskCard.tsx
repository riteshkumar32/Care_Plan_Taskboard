import React from "react";
import type { Task, TaskStatus } from "../types";
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS, ROLE_COLORS, CATEGORY_LABELS } from "../types/constants";
import { useUpdateTask } from "../hooks/useTasks";

interface TaskCardProps {
  task: Task;
  patientId: string;
}

const statusOptions: TaskStatus[] = ["pending", "in_progress", "completed", "overdue"];

export const TaskCard: React.FC<TaskCardProps> = ({ task, patientId }) => {
  const { updateTaskStatus, isPending, getError, clearError } = useUpdateTask();

  const pending = isPending(task.id);
  const error = getError(task.id);

  const isOverdue =
    task.status !== "completed" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  const dueDateFormatted = new Date(task.dueDate).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div
      style={{
        border: `1px solid ${error ? "#fca5a5" : "#e5e7eb"}`,
        borderRadius: "6px",
        padding: "10px 12px",
        background: error ? "#fff5f5" : pending ? "#f9fafb" : "#ffffff",
        opacity: pending ? 0.75 : 1,
        fontSize: "13px",
        position: "relative",
      }}
    >
      {/* Title + category */}
      <div style={{ fontWeight: 500, marginBottom: "4px", color: "#111827" }}>{task.title}</div>
      <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "6px" }}>
        {CATEGORY_LABELS[task.category] ?? task.category}
      </div>

      {/* Role badge */}
      <span
        style={{
          display: "inline-block",
          background: ROLE_COLORS[task.assigneeRole] + "22",
          color: ROLE_COLORS[task.assigneeRole],
          border: `1px solid ${ROLE_COLORS[task.assigneeRole]}55`,
          borderRadius: "3px",
          padding: "1px 6px",
          fontSize: "11px",
          marginBottom: "6px",
        }}
      >
        {ROLE_LABELS[task.assigneeRole]}
        {task.assigneeName ? ` — ${task.assigneeName}` : ""}
      </span>

      {/* Due date */}
      <div style={{ color: isOverdue ? "#dc2626" : "#6b7280", fontSize: "12px", marginBottom: "8px" }}>
        Due: {dueDateFormatted} {isOverdue && "(overdue)"}
      </div>

      {/* Status selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: STATUS_COLORS[task.status],
            flexShrink: 0,
          }}
        />
        <select
          disabled={pending}
          value={task.status}
          onChange={(e) => updateTaskStatus(task.id, patientId, e.target.value as TaskStatus)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "3px",
            padding: "2px 6px",
            fontSize: "12px",
            cursor: pending ? "not-allowed" : "pointer",
            background: "white",
          }}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {pending && <span style={{ fontSize: "11px", color: "#9ca3af" }}>saving…</span>}
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            marginTop: "8px",
            padding: "4px 8px",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "3px",
            fontSize: "11px",
            color: "#991b1b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Update failed — changes rolled back.</span>
          <button
            onClick={() => clearError(task.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
