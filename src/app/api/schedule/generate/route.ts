import { NextResponse } from "next/server";

type Task = {
  id: string;
  name?: string;
  estMinutes?: number | null;
  priority?: "High" | "Medium" | "Low" | string;
  status?: "pending" | "completed" | string;
  dueAt?: string | null;
};

type Prefs = {
  startTime?: string;
  endTime?: string;
  targetHoursPerDay?: number;
};

type Block = {
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
  source: "ai";
};

function makeDate(date: string, time: string) { // combines YYYY-MM-DD and HH:MM into a Date
  return new Date(`${date}T${time}:00`);
}

function addMinutes(date: Date, minutes: number) { // adds minutes to the Date object 
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function POST(request: Request) { // Runs when the frontend sends a POST request

  const body = await request.json();
  const tasks: Task[] = (body.tasks ?? []) as Task[];// Default to empty list 
  const prefs: Prefs = body.prefs || {};
  const today = body.today; // YYY-MM-DD
  const windowStart = makeDate(today, prefs.startTime || "09:00");
  const windowEnd = makeDate(today, prefs.endTime || "17:00");
  const windowMinutes = Math.max(0, (windowEnd.getTime() - windowStart.getTime()) / 60000);
  const targetMinutes = (prefs.targetHoursPerDay || 0) * 60;
  const availableMinutes = Math.min(windowMinutes, targetMinutes);
  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

  const pending: Task[] = tasks // Sort unfinished tasks by priority, due date and alphabetically
    .filter((task: Task) => task.status === "pending" || !task.status)
    .sort((a: Task, b: Task) => {
      const priorityA = priorityOrder[a.priority || "Medium"] ?? 1;
      const priorityB = priorityOrder[b.priority || "Medium"] ?? 1;
      if (priorityA !== priorityB) return priorityA - priorityB;

      const dueTimeA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const dueTimeB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      if (dueTimeA !== dueTimeB) return dueTimeA - dueTimeB;

      return (a.name || "").localeCompare(b.name || "");
    });

  const blocks: Block[] = [];
  let currentTime = windowStart;
  let minutesLeft = availableMinutes;

  for (const task of pending) {
    const duration = Math.max(5, Math.round(task.estMinutes || 0));
    if (minutesLeft <= 0) break;

    const use = Math.min(duration, minutesLeft);
    const start = currentTime;
    const end = addMinutes(start, use);
    if (end > windowEnd) break;

    blocks.push({
      taskId: task.id,
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
      source: "ai",
    });

    currentTime = end;
    minutesLeft -= use;
  }

  return NextResponse.json({ blocks });
}