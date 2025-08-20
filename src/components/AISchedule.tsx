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

export default function AISchedule({ uid }: { uid: string }) {
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

  async function generatePlan() {
    if (!prefs) {
      alert("Please set your scheduling preferences first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasksForApi(tasks),
          prefs: prefsForApi(prefs),
          today: currentDate(),
        }),
      });
      const data = await res.json();
      setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
    }
    catch (e) {
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
    <div className="rounded-2xl border bg-white shadow-sm p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">AI Schedule</h2>

      <div className="flex items-center gap-3">
        <button
          onClick={generatePlan}

          disabled={loading}
          className="rounded px-3 py-2 bg-gray-800 text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        {blocks.length > 0 && (
          <button
            onClick={acceptPlan}
            className="rounded px-3 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Accept Plan ({blocks.length})
          </button>
        )}
      </div>

      {blocks.length === 0 ? (

        <p className="text-sm text-gray-600">
          Click “Generate Plan
        </p>
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
              <li key={b.taskId} className="border rounded p-3">
                <div className="font-medium">{label}</div>
                <div className="text-xs text-gray-600">
                  {start} – {end} | source: {b.source}
                </div>
              </li>
            );
          })}

        </ul>
      )}



    </div>

  );
}
