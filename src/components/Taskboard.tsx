import React from "react";
import { usePatients } from "../hooks/useTasks";
import { FilterBar } from "./FilterBar";
import { PatientRow } from "./PatientRow";

export const Taskboard: React.FC = () => {
  const { patients, loading, error, reload } = usePatients();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
          Dialysis Center — Care Plan Taskboard
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
          Manage patient tasks across nursing, dietetics, and social work teams.
        </p>
      </div>

      <FilterBar />

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "14px" }}>
          Loading patients…
        </div>
      )}

      {/* Error loading patients */}
      {error && (
        <div style={{
          padding: "12px 16px", background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: "6px", color: "#991b1b", fontSize: "14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Failed to load patient list: {error}</span>
          <button
            onClick={reload}
            style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "12px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Patient rows */}
      {!loading && !error && patients.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "14px" }}>
          No patients found.
        </div>
      )}

      {patients.map((patient) => (
        <PatientRow key={patient.id} patient={patient} />
      ))}
    </div>
  );
};
