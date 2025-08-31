"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, } from "firebase/firestore";
import { logEvent } from "../../lib/logEvent";

type Task = {
  id: string;
  name?: string;
  estMinutes?: number | null;
  priority?: "Low" | "Medium" | "High" | null;
  status?: "pending" | "completed" | null;
  dueAt?: any;
};

type Prefs = {
  startTime?: string;
  endTime?: string;
  targetHoursPerDay?: number;
} | null;

type Block = {
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
  source: "ai";
};

export default function AISchedule({ uid, trigger }: { uid: string; trigger?: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);

  function currentDate(): string { // returns date in YYYYMMDD format
    const date = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function toISO(value: any): string | null {
    if (!value) return null;
    if (typeof value === "object" && typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (typeof value === "string") return value;
    return null;
  }

  function tasksForApi(items: Task[]) {
    return items.map((t) => ({
      id: t.id,
      name: t.name || "",
      estMinutes: typeof t.estMinutes === "number" ? t.estMinutes : 0,
      priority: t.priority || "Medium",
      status: t.status || "pending",
      dueAt: toISO(t.dueAt),
    }));
  }

  function prefsForApi(p: Prefs) {
    return {
      startTime: p?.startTime || "09:00",
      endTime: p?.endTime || "17:00",
      targetHoursPerDay:
        typeof p?.targetHoursPerDay === "number" ? p.targetHoursPerDay : 2,
    };
  }

  useEffect(() => {
    const tasksRef = collection(db, "users", uid, "tasks");
    const pendingTaskQuery = query(tasksRef, where("status", "in", ["pending", null as any]));

    const unsubscribeTask = onSnapshot(pendingTaskQuery, (snap) => {
      const updatedTask = snap.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<Task, "id">) }));
      setTasks(updatedTask);
    });
    return unsubscribeTask;
  }, [uid]);

  useEffect(() => {
    async function loadPref() {
      const ref = doc(db, "users", uid, "prefs", "default");
      const snapshot = await getDoc(ref);
      setPrefs(snapshot.exists() ? (snapshot.data() as Prefs) : null);
    }
    loadPref();
  }, [uid]);

  useEffect(() => {
    if (typeof trigger === "number" && trigger > 0) {
      generatePlan();
    }
  }, [trigger]);

  async function generatePlan() {
    if (!prefs) {
      alert("Please set your scheduling preferences first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/goals/llm-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          tasks: tasksForApi(tasks),
          prefs: prefsForApi(prefs),
          today: currentDate(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      console.log("AI response:", data);
      const aiTasks: any[] =
        Array.isArray(data.tasks) && data.tasks.length > 0
          ? data.tasks
          : tasksForApi(tasks);
      const startTime = prefsForApi(prefs).startTime || "09:00";
      const startStr = `${currentDate()}T${startTime}:00`;
      let cursor = new Date(startStr);

      const producedBlocks: Block[] = aiTasks.map((t: any): Block => {
        const minutes = Number.isFinite(t?.estMinutes) ? t.estMinutes : 30;

        const startISO = cursor.toISOString();
        const end = new Date(cursor);
        end.setMinutes(end.getMinutes() + minutes);
        const endISO = end.toISOString();
        cursor = end;
        const id = t.id ?? t.taskId ?? crypto.randomUUID?.() ?? Math.random().toString();

        return {
          taskId: String(id),
          scheduledStart: startISO,
          scheduledEnd: endISO,
          source: "ai",
        };
      });

      setBlocks(producedBlocks);
    } catch (e) {
      console.error(e);
      alert("Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  }



  async function acceptPlan() {
    if (!blocks.length) return;

    try {
      for (const b of blocks) {
        const tRef = doc(db, "users", uid, "tasks", b.taskId);
        await updateDoc(tRef, {
          scheduledStart: b.scheduledStart,
          scheduledEnd: b.scheduledEnd,
          scheduleSource: b.source,
        });

      }
      await logEvent(uid, "regenerate", {
        details: `Accepted AI plan with ${blocks.length} blocks`,
      });
      alert("Plan accepted and saved to tasks.");
      setBlocks([]);
    } catch (e) {

      console.error(e);
      alert("Could not save the plan.");
    }
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-white p-5 shadow space-y-4">

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={generatePlan}

          disabled={loading}
          className="bg-gray-800 px-4 text-white py-2 rounded"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        {blocks.length > 0 && (
          <button
            onClick={acceptPlan}
            className="rounded px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow">
            Accept Plan ({blocks.length})
          </button>
        )}
      </div>

      {
        blocks.length === 0 ? (

          <p className="text-gray-700 mb-1 text-sm block">Click “Generate Plan”.</p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => {
              const taskItem = tasks.find((matchingTask) => matchingTask.id === b.taskId);

              const label = taskItem?.name || "(unknown task)";
              const start = new Date(b.scheduledStart).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const end = new Date(b.scheduledEnd).toLocaleTimeString([], {
                hour: "2-digit",

                minute: "2-digit",
              });

              return (
                <li key={b.taskId} className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                  <div className="font-medium text-gray-100">{label}</div>
                  <div className="text-xs text-gray-300">
                    {start} – {end} | source: {b.source}
                  </div>
                </li>
              );
            })}

          </ul>
        )
      }



    </div >

  );
}
