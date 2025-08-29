export type Task = {
  name: string;
  category: "Study" | "Practice" | "Review" | "Project";
  priority: "Low" | "Medium" | "High";
  estMinutes: number;
};

export type PlanInput = {
  uid: string;
  goalId: string;
  goalTitle: string;
  constraints?: string;
};

export type PlanResult = {
  goalId: string;
  tasks: Task[];
};

export async function generatePlan(input: PlanInput): Promise<PlanResult> {
  const res = await fetch("/api/goals/llm-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });


  if (!res.ok) {
    const text = await res.text().catch(() => "");

    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}
