import { normalizeTask, normalizePatient } from "../api/client";
import type { TaskDTO, PatientDTO } from "../types";

describe("normalizeTask", () => {
  const base: TaskDTO = {
    id: "t1",
    patient_id: "p1",
    title: "Monthly labs",
    category: "monthly_labs",
    status: "pending",
    assignee_role: "nurse",
    due_date: "2025-06-01",
    created_at: "2025-05-01",
  };

  test("maps snake_case fields to camelCase", () => {
    const result = normalizeTask(base);
    expect(result.patientId).toBe("p1");
    expect(result.assigneeRole).toBe("nurse");
    expect(result.dueDate).toBe("2025-06-01");
    expect(result.createdAt).toBe("2025-05-01");
  });

  test("defaults missing category to 'other'", () => {
    const dto = { ...base, category: undefined } as unknown as TaskDTO;
    expect(normalizeTask(dto).category).toBe("other");
  });

  test("defaults unknown category to 'other'", () => {
    const dto = { ...base, category: "new_future_category" };
    expect(normalizeTask(dto).category).toBe("other");
  });

  test("defaults invalid status to 'pending'", () => {
    const dto = { ...base, status: "weird_status" };
    expect(normalizeTask(dto).status).toBe("pending");
  });

  test("defaults invalid role to 'nurse'", () => {
    const dto = { ...base, assignee_role: "admin" };
    expect(normalizeTask(dto).assigneeRole).toBe("nurse");
  });

  test("defaults missing title to 'Untitled Task'", () => {
    const dto = { ...base, title: undefined } as unknown as TaskDTO;
    expect(normalizeTask(dto).title).toBe("Untitled Task");
  });

  test("preserves optional fields when present", () => {
    const dto = { ...base, assignee_id: "u1", assignee_name: "Nurse Patel", notes: "check notes" };
    const result = normalizeTask(dto);
    expect(result.assigneeId).toBe("u1");
    expect(result.assigneeName).toBe("Nurse Patel");
    expect(result.notes).toBe("check notes");
  });
});

describe("normalizePatient", () => {
  const base: PatientDTO = {
    id: "p1",
    name: "Rajesh Kumar",
    mrn: "MRN-001",
  };

  test("maps basic fields correctly", () => {
    const result = normalizePatient(base);
    expect(result.id).toBe("p1");
    expect(result.name).toBe("Rajesh Kumar");
    expect(result.mrn).toBe("MRN-001");
  });

  test("defaults missing name to 'Unknown Patient'", () => {
    const dto = { ...base, name: undefined } as unknown as PatientDTO;
    expect(normalizePatient(dto).name).toBe("Unknown Patient");
  });

  test("maps dialysis_type correctly", () => {
    const dto = { ...base, dialysis_type: "hemodialysis" };
    expect(normalizePatient(dto).dialysisType).toBe("hemodialysis");
  });

  test("ignores unknown dialysis_type", () => {
    const dto = { ...base, dialysis_type: "laser_dialysis" };
    expect(normalizePatient(dto).dialysisType).toBeUndefined();
  });

  test("missing dialysisType stays undefined", () => {
    expect(normalizePatient(base).dialysisType).toBeUndefined();
  });
});