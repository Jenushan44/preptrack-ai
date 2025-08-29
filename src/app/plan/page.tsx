"use client";
import { useState } from "react";

export default function PlanPage() {
  const [goalTitle, setGoalTitle] = useState(""); // user types
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false); //shows spinner while waiting
  const [error, setError] = useState<string | null>(null); // shows an error messageif something fails
  const [result, setResult] = useState<{ goalId: string; tasks: any[] } | null>(null); // holds response from api

  const uid = "user123";
  const goalId = "goal-001";

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const result = await fetch("/api/goals/llm-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, goalId, goalTitle, constraints }),
      });
      if (!result.ok) throw new Error(await result.text());
      const json = await result.json();
      setResult(json);
    } catch (error: any) {
      setError(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
                <div className="text-sm text-gray-600">
                  Category: {t.category} | Priority: {t.priority} | Est: {t.estMinutes} mins
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <summary className="cursor-pointer">Raw JSON</summary>
            <code className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(result, null, 2)}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
