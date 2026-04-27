# Dialysis Center — Care Plan Taskboard

A frontend task management board for dialysis center staff. Tracks patient care tasks across nursing, dietetics, and social work teams.

---

## Tech Stack

- **React + TypeScript** — UI
- **Zustand** — state management
- **MSW (Mock Service Worker)** — fake backend for development
- **Vite** — dev server and bundler
- **Vitest** — tests

---

## How to Run

### First time setup

```bash
npm install
mkdir public
npx msw init public/ --save
npm run dev
```

### Every time after that

```bash
npm run dev
```

Open browser at: **http://localhost:5173**

---

## How to Run Tests

```bash
npm test
```

---

## Folder Structure

```
dialysis-taskboard/
├── public/                        # MSW service worker lives here
├── src/
│   ├── api/
│   │   └── client.ts              # HTTP calls, retry logic, DTO normalization
│   ├── types/
│   │   ├── index.ts               # All TypeScript types and interfaces
│   │   └── constants.ts           # Labels, colors, config
│   ├── store/
│   │   └── taskboardStore.ts      # Zustand store — all app state lives here
│   ├── hooks/
│   │   └── useTasks.ts            # React hooks wrapping the store
│   ├── components/
│   │   ├── Taskboard.tsx          # Main page
│   │   ├── PatientRow.tsx         # One row per patient with 4 status columns
│   │   ├── TaskCard.tsx           # Individual task card
│   │   ├── FilterBar.tsx          # Role / time / search filters
│   │   └── CreateTaskModal.tsx    # Form to create a new task
│   ├── mocks/
│   │   ├── handlers.ts            # Fake API responses (patients + tasks)
│   │   └── browser.ts             # MSW browser setup
│   ├── __tests__/
│   │   ├── useTasks.test.ts       # Hook + filter logic tests
│   │   ├── TaskCard.test.tsx      # Component behavior tests
│   │   ├── normalize.test.ts      # DTO edge case tests
│   │   └── setup.ts               # Test setup
│   ├── App.tsx                    # App root, starts MSW
│   └── main.tsx                   # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## How to Add a New Staff Role

Example: adding a **Pharmacist** role.

**1. `src/types/index.ts`** — add to the union:
```ts
export type StaffRole = "nurse" | "dietician" | "social_worker" | "pharmacist";
```

**2. `src/types/constants.ts`** — add label and color:
```ts
export const ROLE_LABELS: Record<StaffRole, string> = {
  ...
  pharmacist: "Pharmacist",
};

export const ROLE_COLORS: Record<StaffRole, string> = {
  ...
  pharmacist: "#8b5cf6",
};
```

**3. `src/api/client.ts`** — add to the validator:
```ts
function isValidRole(s: string): s is StaffRole {
  return ["nurse", "dietician", "social_worker", "pharmacist"].includes(s);
}
```

That's it. The filter dropdown and task form pick it up automatically.

---

## How to Add a New Task Category

Example: adding **Mental Health**.

**1. `src/types/index.ts`**:
```ts
export type TaskCategory = ... | "mental_health";
```

**2. `src/types/constants.ts`**:
```ts
export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  ...
  mental_health: "Mental Health",
};
```

**3. `src/api/client.ts`**:
```ts
function isValidCategory(s: string): s is TaskCategory {
  return [..., "mental_health"].includes(s);
}
```

No component changes needed.

---

## Features

- Taskboard with one row per patient, columns by status (Overdue / In Progress / Pending / Completed)
- Filter by role, time (overdue / due today / upcoming), and search
- Create new tasks per patient
- Optimistic UI — status changes apply instantly, roll back if server fails
- Retry logic — failed API calls retry up to 3 times with exponential backoff
- Graceful handling of missing/unexpected fields from backend
