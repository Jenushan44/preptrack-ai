"use client";
import { useState } from "react";
import { db } from "../../../firebase/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function PlanPage() {
  const [goalTitle, setGoalTitle] = useState(""); // user types
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false); //shows spinner while waiting
  const [error, setError] = useState<string | null>(null); // shows an error messageif something fails
  const [result, setResult] = useState<{ goalId: string; tasks: any[] } | null>(null); // holds response from api
  const ML_BASE = "http://127.0.0.1:8000";
  const [probs, setProbs] = useState<number[] | null>(null);
  const uid = "user123";
  const goalId = "goal-001";

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setProbs(null);
    try {
      const res = await fetch("/api/goals/llm-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, goalId, goalTitle, constraints }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      await saveTasksFirestore(uid, goalId, json.tasks);
      setResult(json);
      const payload = json.tasks.map((t: any) => ({
        category: t.category,
        priority: t.priority,
        estMinutes: t.estMinutes,
      }));

      const mlRes = await fetch(`${ML_BASE}/predict-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!mlRes.ok) throw new Error(await mlRes.text());
      const mlJson = await mlRes.json();
      setProbs(mlJson.p);

    } catch (error: any) {
      setError(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function saveTasksFirestore(uid: string, goalId: string, tasks: any[]) {
    const tasksCollection = collection(db, "users", uid, "tasks");
    for (const t of tasks) {
      await addDoc(tasksCollection, {
        goalId,
        name: t.name,
        category: t.category,
        priority: t.priority,
        estMinutes: t.estMinutes,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    }
  }

  function Badge({ p }: { p?: number }) {
    if (p == null) return null;
    if (p >= 0.67) return <span className="ml-2 rounded bg-green-100 text-green-800 text-xs px-2 py-0.5">Likely</span>;
    if (p >= 0.33) return <span className="ml-2 rounded bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5">50–50</span>;
    return <span className="ml-2 rounded bg-red-100 text-red-800 text-xs px-2 py-0.5">Tough</span>;
  }


  return (
    <div className="max-w-xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Plan</h1>

      <label className="block font-medium">Goal Title</label>
      <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Finish school assignment" className="w-full p-2 mt-1 mb-3 border rounded" />
      <label className="block font-medium">Constraints (optional)</label>
      <input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="≤ 45 minutes per session" className="w-full p-2 mt-1 mb-3 border rounded" />
      <button onClick={onGenerate} disabled={loading || !goalTitle} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" >
        {loading ? "Generating..." : "Generate Plan"}
      </button>
      {error && <p className="text-red-500 mt-3">{error}</p>}
      {result?.tasks && (
        <div className="mt-5">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <ul className="list-disc pl-5 mt-2">
            {result.tasks.map((t: any, i: number) => (
              <li key={i} className="mb-2">
                <strong>{t.name}</strong>
                <Badge p={probs?.[i]} />
                <div className="text-sm text-gray-600">
                  Category: {t.category} | Priority: {t.priority} | Est: {t.estMinutes} mins
                </div>
              </li>
            ))}
          </ul>
          <details className="mt-3">
            <summary className="cursor-pointer">JSON</summary>
            <div className="whitespace-pre bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(result, null, 2)}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
