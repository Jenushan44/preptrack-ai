"use client";

import { useState } from "react";
import { db } from "../../firebase/firebaseConfig"; // connection to Firestore database 
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function TaskForm({ uid }: { uid: string }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [estMinutes, setEstMinutes] = useState<number | "">(""); // Input can be empty 
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return; // Doesn't allow empty tasks 
    setSaving(true); // Shows "Saving..." on the button 

    await addDoc(collection(db, "users", uid, "tasks"), {
      name: name.trim(),
      category: category || "General", // Sets category to General if empty 
      priority,
      estMinutes: estMinutes === "" ? null : Number(estMinutes),
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // Reset all input fields for next task 
    setName("");
    setCategory("");
    setPriority("Medium");
    setEstMinutes("");

    setSaving(false);
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow">
      <input className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800" placeholder="Task name" value={name} onChange={(e) => setName(e.target.value)} />

      <input className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800" placeholder="Category (e.g., Study, Work)" value={category} onChange={(e) => setCategory(e.target.value)} />

      <select className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:border-blue-500" value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>

      <input
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800"
        min={5}
        step={5}
        placeholder="Estimated minutes (e.g., 30)"
        value={estMinutes}
        onChange={(e) => {
          const v = e.target.value;
          setEstMinutes(v === "" ? "" : Number(v));
        }}
      />

      <button
        className="bg-gray-800 px-4 text-white py-2 rounded"
        disabled={saving || !name.trim()}
      >
        {saving ? "Saving..." : "Add Task"}
      </button>
    </form >
  );
}