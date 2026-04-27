import { http, HttpResponse, delay } from "msw";

const patients = [
  { id: "p1", name: "Rajesh Kumar", mrn: "MRN-001", dialysis_type: "hemodialysis", ward: "Dialysis A" },
  { id: "p2", name: "Sunita Devi", mrn: "MRN-002", dialysis_type: "peritoneal", ward: "Dialysis B" },
  { id: "p3", name: "Anil Sharma", mrn: "MRN-003", dialysis_type: "hemodialysis", ward: "Dialysis A" },
  { id: "p4", name: "Priya Singh", mrn: "MRN-004", ward: "Dialysis C" }, // no dialysis_type — tests optional field
];

const now = new Date();
const yesterday = new Date(now.getTime() - 86400000).toISOString();
const today = now.toISOString();
const tomorrow = new Date(now.getTime() + 86400000).toISOString();
const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString();

let tasks = [
  { id: "t1", patient_id: "p1", title: "Monthly blood panel", category: "monthly_labs", status: "overdue", assignee_role: "nurse", assignee_name: "Nurse Patel", due_date: yesterday, created_at: yesterday },
  { id: "t2", patient_id: "p1", title: "Diet assessment Q3", category: "diet_counselling", status: "pending", assignee_role: "dietician", assignee_name: "Dr. Mehta", due_date: today, created_at: yesterday },
  { id: "t3", patient_id: "p1", title: "Fistula inspection", category: "access_check", status: "in_progress", assignee_role: "nurse", due_date: today, created_at: yesterday },
  { id: "t4", patient_id: "p2", title: "Hepatitis B booster", category: "vaccination", status: "pending", assignee_role: "nurse", due_date: tomorrow, created_at: yesterday },
  { id: "t5", patient_id: "p2", title: "Housing assessment", category: "social_work", status: "completed", assignee_role: "social_worker", assignee_name: "SW Rao", due_date: yesterday, created_at: yesterday },
  { id: "t6", patient_id: "p2", title: "Phosphate binder review", category: "medication_review", status: "pending", assignee_role: "dietician", due_date: nextWeek, created_at: yesterday },
  { id: "t7", patient_id: "p3", title: "Monthly labs", category: "monthly_labs", status: "pending", assignee_role: "nurse", due_date: today, created_at: yesterday },
  { id: "t8", patient_id: "p3", title: "Transport support", category: "social_work", status: "in_progress", assignee_role: "social_worker", due_date: nextWeek, created_at: yesterday },
  { id: "t9", patient_id: "p4", title: "Fluid intake counselling", category: "diet_counselling", status: "overdue", assignee_role: "dietician", due_date: yesterday, created_at: yesterday },
  { id: "t10", patient_id: "p4", title: "Catheter site check", category: "access_check", status: "pending", assignee_role: "nurse", due_date: tomorrow, created_at: yesterday },
];

let taskIdCounter = 11;

export const handlers = [
  http.get("/api/patients", async () => {
    await delay(400);
    return HttpResponse.json(patients);
  }),

  http.get("/api/patients/:id/tasks", async ({ params }) => {
    await delay(300);
    const patientTasks = tasks.filter((t) => t.patient_id === params.id);
    return HttpResponse.json(patientTasks);
  }),

  http.post("/api/patients/:id/tasks", async ({ request, params }) => {
    await delay(500);
    const body = await request.json() as Record<string, string>;
    const newTask = {
      id: `t${taskIdCounter++}`,
      patient_id: params.id as string,
      title: body.title,
      category: body.category ?? "other",
      status: "pending",
      assignee_role: body.assignee_role ?? "nurse",
      assignee_name: undefined,
      due_date: body.due_date,
      notes: body.notes,
      created_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    return HttpResponse.json(newTask, { status: 201 });
  }),

  http.patch("/api/tasks/:id", async ({ request, params }) => {
    await delay(400);
    const body = await request.json() as Record<string, string>;
    const idx = tasks.findIndex((t) => t.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: "Not found" }, { status: 404 });
(tasks[idx] as Record<string, unknown>) = { ...tasks[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(tasks[idx]);
  }),
];