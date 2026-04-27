import React, { useState } from "react";
import { useCreateTask } from "../hooks/useTasks";
import type { TaskCategory, StaffRole } from "../types";
import { CATEGORY_LABELS, ROLE_LABELS } from "../types/constants";

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

const categories = Object.keys(CATEGORY_LABELS) as TaskCategory[];
const roles = Object.keys(ROLE_LABELS) as StaffRole[];

export const CreateTaskModal: React.FC<Props> = ({ patientId, patientName, onClose }) => {
  const { createTask, error } = useCreateTask(patientId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("monthly_labs");
  const [role, setRole] = useState<StaffRole>("nurse");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) { setLocalError("Title is required."); return; }
    setLocalError(null);
    setSubmitting(true);
    try {
      await createTask({ title: title.trim(), category, assigneeRole: role, dueDate, notes: notes.trim() || undefined });
      onClose();
    } catch {
      // error shown via store
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "13px",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "white", borderRadius: "8px", padding: "24px", width: "420px", maxWidth: "95vw" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#111827" }}>
          New Task — {patientName}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monthly blood panel" />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
              {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Assign to Role</label>
            <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Due Date</label>
            <input type="date" style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        {(localError || error) && (
          <div style={{ marginTop: "10px", padding: "6px 10px", background: "#fee2e2", borderRadius: "4px", fontSize: "12px", color: "#991b1b" }}>
            {localError ?? error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button
            onClick={onClose}
            style={{ padding: "7px 14px", border: "1px solid #d1d5db", borderRadius: "4px", background: "white", cursor: "pointer", fontSize: "13px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "7px 14px", border: "none", borderRadius: "4px",
              background: submitting ? "#9ca3af" : "#2563eb", color: "white",
              cursor: submitting ? "not-allowed" : "pointer", fontSize: "13px",
            }}
          >
            {submitting ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};
