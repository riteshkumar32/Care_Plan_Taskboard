import React, { useState } from "react";
import type { Patient } from "../types";
import { usePatientTasks } from "../hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";

interface Props {
  patient: Patient;
}

export const PatientRow: React.FC<Props> = ({ patient }) => {
  const { tasks, loading, error, reload } = usePatientTasks(patient.id);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const byStatus = {
    overdue: tasks.filter((t) => t.status === "overdue"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    pending: tasks.filter((t) => t.status === "pending"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        marginBottom: "16px",
        overflow: "hidden",
        background: "white",
      }}
    >
      {/* Patient header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "#f9fafb",
          borderBottom: expanded ? "1px solid #e5e7eb" : "none",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "14px" }}>{expanded ? "▾" : "▸"}</span>
          <div>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{patient.name}</span>
            <span style={{ marginLeft: "10px", color: "#6b7280", fontSize: "12px" }}>MRN: {patient.mrn}</span>
            {patient.ward && (
              <span style={{ marginLeft: "8px", color: "#9ca3af", fontSize: "12px" }}>{patient.ward}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Summary badges */}
          {byStatus.overdue.length > 0 && (
            <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
              {byStatus.overdue.length} overdue
            </span>
          )}
          <span style={{ color: "#6b7280", fontSize: "12px" }}>{tasks.length} tasks</span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            style={{
              padding: "4px 10px", background: "#2563eb", color: "white",
              border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer",
            }}
          >
            + Task
          </button>
        </div>
      </div>

      {/* Task columns */}
      {expanded && (
        <div style={{ padding: "12px 16px" }}>
          {loading && (
            <div style={{ color: "#9ca3af", fontSize: "13px", padding: "8px 0" }}>Loading tasks…</div>
          )}

          {error && (
            <div style={{
              padding: "8px 12px", background: "#fee2e2", borderRadius: "4px",
              fontSize: "13px", color: "#991b1b", display: "flex", justifyContent: "space-between",
            }}>
              <span>Failed to load tasks: {error}</span>
              <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: "12px" }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", minWidth: 0 }}>
              {(["overdue", "in_progress", "pending", "completed"] as const).map((status) => (
                <div key={status}>
                  <div style={{
                    fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.05em", color: "#6b7280", marginBottom: "8px",
                  }}>
                    {status.replace("_", " ")}
                    <span style={{ marginLeft: "6px", fontWeight: 400 }}>({byStatus[status].length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {byStatus[status].length === 0 ? (
                      <div style={{ color: "#d1d5db", fontSize: "12px", padding: "8px 0" }}>—</div>
                    ) : (
                      byStatus[status].map((task) => (
                        <TaskCard key={task.id} task={task} patientId={patient.id} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CreateTaskModal
          patientId={patient.id}
          patientName={patient.name}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};
