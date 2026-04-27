import React from "react";
import { useFilters } from "../hooks/useTasks";
import type { StaffRole, TimeFilter } from "../types";
import { ROLE_LABELS } from "../types/constants";

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due Today" },
  { value: "upcoming", label: "Upcoming" },
];

const roleOptions: { value: StaffRole | "all"; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "nurse", label: ROLE_LABELS.nurse },
  { value: "dietician", label: ROLE_LABELS.dietician },
  { value: "social_worker", label: ROLE_LABELS.social_worker },
];

export const FilterBar: React.FC = () => {
  const { filters, setFilters } = useFilters();

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", padding: "12px 0" }}>
      <input
        type="text"
        placeholder="Search tasks..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        style={{
          padding: "6px 10px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "13px",
          width: "180px",
        }}
      />

      <select
        value={filters.role}
        onChange={(e) => setFilters({ role: e.target.value as StaffRole | "all" })}
        style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
      >
        {roleOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={filters.time}
        onChange={(e) => setFilters({ time: e.target.value as TimeFilter })}
        style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
      >
        {timeOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
};
