
/**
 * API helper for Plant Nursery Manager.
 * Uses the Express backend when NEXT_PUBLIC_API_URL is configured.
 * Otherwise, uses local mock data.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL;

export type Role = "owner" | "manager" | "staff";

export type User = {
  full_name: string;
  role: Role;
  nursery_name: string;
  currency_code: string;
};

export type Batch = {
  batch_id: number;
  name: string;
  sown_date: string;
  stock: number;
};

export type Overdue = {
  batch_id: number;
  name: string;
  last_watered: string | null;
  due_date?: string;
  days_overdue: number;
};

export type Health = "healthy" | "weak" | "diseased";

export type Observation = {
  observation_id: number;
  batch_id: number;
  observed_on: string;
  health_status: Health;
  avg_height_cm: number | null;
  plants_lost: number;
  notes: string;
};

export type IssueCategory =
  | "pest"
  | "disease"
  | "nutrient"
  | "environmental"
  | "other";

export type Issue = {
  issue_id: number;
  name: string;
  category: IssueCategory;
  description: string | null;
};

export type TreatmentStatus =
  | "planned"
  | "in_progress"
  | "completed";

export type Treatment = {
  treatment_id: number;
  batch_id: number;
  observation_id: number;
  issue_id: number | null;
  issue_name: string | null;
  treatment_name: string;
  treatment_date: string;
  status: TreatmentStatus;
  notes: string | null;
};

export type Expense = {
  expense_id: number;
  batch_id: number;
  spent_on: string;
  category: string;
  amount: number;
  description: string;
};

export type WateringInput = {
  batch_id: number;
  watered_on: string;
  amount_litres: number | null;
  notes: string;
};

export type ObservationInput = {
  batch_id: number;
  observed_on: string;
  health_status: Health;
  avg_height_cm: number | null;
  plants_lost: number;
  notes: string;
};

export type TreatmentInput = {
  observation_id: number;
  issue_id: number;
  treatment_name: string;
  treatment_date: string;
  status: TreatmentStatus;
  notes: string | null;
};

export type ExpenseInput = {
  batch_id: number;
  spent_on: string;
  category: string;
  amount: number;
  description: string;
};

/* ---------------- HTTP helper ---------------- */

async function http<T>(
  path: string,
  body?: unknown
): Promise<T> {
  if (!BASE) {
    throw new Error("Backend URL is not configured.");
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const hasBody = body !== undefined;

  const res = await fetch(`${BASE}${path}`, {
    method: hasBody ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed: ${res.status}`
    );
  }

  return data as T;
}

/* ---------------- Mock data ---------------- */

const wait = () =>
  new Promise((resolve) => setTimeout(resolve, 250));

let nid = 100;

const mock = {
  batches: [
    {
      batch_id: 1,
      name: "Roma tomato (seedling), batch 1",
      sown_date: "2026-09-01",
      stock: 20,
    },
    {
      batch_id: 2,
      name: "Curry leaf (sapling), batch 2",
      sown_date: "2026-08-10",
      stock: 60,
    },
    {
      batch_id: 3,
      name: "Marigold (seed), batch 3",
      sown_date: "2026-10-05",
      stock: 240,
    },
  ] as Batch[],

  overdue: [
    {
      batch_id: 1,
      name: "Roma tomato (seedling), batch 1",
      last_watered: "2026-10-20",
      days_overdue: 4,
    },
    {
      batch_id: 3,
      name: "Marigold (seed), batch 3",
      last_watered: "2026-10-23",
      days_overdue: 1,
    },
  ] as Overdue[],

  issues: [
    {
      issue_id: 1,
      name: "Aphids",
      category: "pest",
      description: null,
    },
    {
      issue_id: 2,
      name: "Leaf blight",
      category: "disease",
      description: null,
    },
    {
      issue_id: 3,
      name: "Powdery mildew",
      category: "disease",
      description: null,
    },
    {
      issue_id: 4,
      name: "Nitrogen deficiency",
      category: "nutrient",
      description: null,
    },
  ] as Issue[],

  observations: [
    {
      observation_id: 1,
      batch_id: 1,
      observed_on: "2026-10-11",
      health_status: "weak",
      avg_height_cm: 9.5,
      plants_lost: 0,
      notes: "Yellow edges on lower leaves",
    },
  ] as Observation[],

  treatments: [
    {
      treatment_id: 1,
      batch_id: 1,
      observation_id: 1,
      issue_id: 2,
      issue_name: "Leaf blight",
      treatment_name: "Copper spray, repeat in 5 days",
      treatment_date: "2026-10-11",
      status: "in_progress",
      notes: null,
    },
  ] as Treatment[],

  expenses: [
    {
      expense_id: 1,
      batch_id: 1,
      spent_on: "2026-09-01",
      category: "seeds",
      amount: 1800,
      description: "Roma tomato seed packets",
    },
    {
      expense_id: 2,
      batch_id: 1,
      spent_on: "2026-09-15",
      category: "fertilizer",
      amount: 650,
      description: "Vermicompost",
    },
  ] as Expense[],
};

/* ---------------- User ---------------- */

export function getUser(): User {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("user");

    if (saved) {
      return JSON.parse(saved);
    }
  }

  return {
    full_name: "Meena",
    role: "staff",
    nursery_name: "Green Leaf Nursery",
    currency_code: "INR",
  };
}

export function setDemoRole(role: Role) {
  const user = getUser();

  localStorage.setItem(
    "user",
    JSON.stringify({ ...user, role })
  );

  window.dispatchEvent(new Event("role-change"));
}

/* ---------------- Batches ---------------- */

export async function getBatches(): Promise<Batch[]> {
  if (BASE) {
    const data = await http<{
      batches: Array<{
        batch_id: string | number;
        batch_name: string;
        sow_date: string;
        current_stock: string | number;
      }>;
    }>("/batches?nurseryId=1");

    return (data.batches ?? []).map((batch) => ({
      batch_id: Number(batch.batch_id),
      name: batch.batch_name,
      sown_date: batch.sow_date,
      stock: Number(batch.current_stock),
    }));
  }

  await wait();
  return [...mock.batches];
}

/* ---------------- Watering ---------------- */

export async function getOverdue(): Promise<Overdue[]> {
  if (BASE) {
    const data = await http<{
      count: number;
      overdueBatches: Array<{
        batch_id: number | string;
        name: string;
        last_watered: string | null;
        due_date: string;
        days_overdue: number | string;
      }>;
    }>("/watering/overdue?nurseryId=1");

    return (data.overdueBatches ?? []).map((item) => ({
      batch_id: Number(item.batch_id),
      name: item.name,
      last_watered: item.last_watered,
      due_date: item.due_date,
      days_overdue: Number(item.days_overdue),
    }));
  }

  await wait();
  return [...mock.overdue];
}

export async function logWatering(i: WateringInput) {
  if (BASE) {
    return http("/watering", {
      nurseryId: 1,
      batchId: Number(i.batch_id),
      wateredAt: i.watered_on,
      quantityLitres: i.amount_litres,
      notes: i.notes,
    });
  }

  await wait();

  mock.overdue = mock.overdue.filter(
    (o) => o.batch_id !== i.batch_id
  );
}

/* ---------------- Health observations ---------------- */

export async function getObservations(
  batchId: number
): Promise<Observation[]> {
  if (BASE) {
    const data = await http<{
      count: number | null;
      observations: Array<{
        observation_id: number;
        batch_id: number;
        observed_at: string;
        health_status: string;
        plants_lost: number;
        notes: string | null;
      }>;
    }>(
      `/observations?nurseryId=1&batchId=${batchId}`
    );

    return (data.observations ?? []).map((o) => ({
      observation_id: Number(o.observation_id),
      batch_id: Number(o.batch_id),
      observed_on: String(o.observed_at).slice(0, 10),
      health_status:
        o.health_status === "unhealthy"
          ? "diseased"
          : o.health_status === "recovering"
          ? "weak"
          : "healthy",
      avg_height_cm: null,
      plants_lost: Number(o.plants_lost ?? 0),
      notes: o.notes ?? "",
    }));
  }

  await wait();

  return mock.observations.filter(
    (o) => o.batch_id === batchId
  );
}

export async function logObservation(i: ObservationInput) {
  if (BASE) {
    return http("/observations", {
      nurseryId: 1,
      batchId: Number(i.batch_id),
      observedAt: i.observed_on,
      healthStatus:
        i.health_status === "diseased"
          ? "unhealthy"
          : i.health_status === "weak"
          ? "recovering"
          : "healthy",
      plantsLost: Number(i.plants_lost),
      notes: i.notes,
    });
  }

  await wait();

  mock.observations.push({
    observation_id: Date.now(),
    ...i,
  });
}

/* ---------------- Issues ---------------- */

export async function getIssues(): Promise<Issue[]> {
  if (BASE) {
    const data = await http<{
      count: number | null;
      issues: Issue[];
    }>("/issues?nurseryId=1");

    return Array.isArray(data.issues)
      ? data.issues
      : [];
  }

  await wait();
  return [...mock.issues];
}

/* ---------------- Treatments ---------------- */

export async function getTreatments(
  batchId: number
): Promise<Treatment[]> {
  if (BASE) {
    const data = await http<{
      count: number | null;
      treatments: Array<{
        treatment_id: number;
        batch_id: number | string;
        observation_id: number;
        issue_id: number | null;
        issue_name: string | null;
        treatment_name: string;
        treatment_date: string;
        status: TreatmentStatus;
        notes: string | null;
      }>;
    }>("/treatments?nurseryId=1");

    return (data.treatments ?? [])
      .filter(
        (t) => Number(t.batch_id) === Number(batchId)
      )
      .map((t) => ({
        ...t,
        treatment_id: Number(t.treatment_id),
        batch_id: Number(t.batch_id),
        observation_id: Number(t.observation_id),
        issue_id:
          t.issue_id === null ? null : Number(t.issue_id),
        treatment_date: String(t.treatment_date).slice(0, 10),
      }));
  }

  await wait();

  return mock.treatments.filter(
    (t) => t.batch_id === batchId
  );
}

export async function logTreatment(i: TreatmentInput) {
  if (BASE) {
    return http("/treatments", {
      nurseryId: 1,
      observationId: Number(i.observation_id),
      issueId: Number(i.issue_id),
      treatmentName: i.treatment_name,
      treatmentDate: i.treatment_date,
      status: i.status,
      notes: i.notes,
    });
  }

  await wait();

  const observation = mock.observations.find(
    (o) => o.observation_id === i.observation_id
  );

  const issue = mock.issues.find(
    (x) => x.issue_id === i.issue_id
  );

  if (!observation || !issue) {
    throw new Error("Selected observation or issue was not found.");
  }

  mock.treatments.unshift({
    treatment_id: nid++,
    batch_id: observation.batch_id,
    observation_id: i.observation_id,
    issue_id: i.issue_id,
    issue_name: issue.name,
    treatment_name: i.treatment_name,
    treatment_date: i.treatment_date,
    status: i.status,
    notes: i.notes,
  });
}

/* ---------------- Expenses ---------------- */

export async function getExpenses(
  batchId: number
): Promise<Expense[]> {
  if (BASE) {
    const data = await http<Array<{
      expense_id: number;
      batch_id: number | string;
      category: string;
      amount: number | string;
      expense_date: string;
      description: string | null;
    }>>("/expenses?nurseryId=1");

    return (Array.isArray(data) ? data : [])
      .filter(
        (e) => Number(e.batch_id) === Number(batchId)
      )
      .map((e) => ({
        expense_id: Number(e.expense_id),
        batch_id: Number(e.batch_id),
        spent_on: String(e.expense_date).slice(0, 10),
        category: e.category,
        amount: Number(e.amount),
        description: e.description ?? "",
      }));
  }

  await wait();

  return mock.expenses.filter(
    (e) => e.batch_id === batchId
  );
}

export async function logExpense(i: ExpenseInput) {
  if (BASE) {
    return http("/expenses", {
      nurseryId: 1,
      batchId: Number(i.batch_id),
      category: i.category,
      amount: Number(i.amount),
      expenseDate: i.spent_on,
      description: i.description,
    });
  }

  await wait();

  mock.expenses.unshift({
    expense_id: nid++,
    ...i,
  });
}

