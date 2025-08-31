"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { logEvent } from "../../lib/logEvent";

type Task = {
  id: string;
  name?: string;
  category?: string;
  priority?: string;
  estMinutes?: number | null;
  status?: string;
  dueAt?: Timestamp | null;
};

export default function TaskList({ uid, onRegenerate }: { uid: string; onRegenerate?: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]); // Used to hold all tasks read from Firestore 
  const [editingId, setEditingId] = useState<string | null>(null); // Task being edited 
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [editMinutes, setEditMinutes] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const visibleTasks = tasks.filter((t) => t.status !== "completed");

  useEffect(() => {
    const tasksRef = collection(db, "users", uid, "tasks"); // Points to users/{uid}/tasks 
    const tasksQuery = query(tasksRef, orderBy("createdAt", "desc")); // Ordered by createdAt, newest first

    // Listens for real-time updates and runs whenever tasks change
    const stopListening = onSnapshot(tasksQuery, (snapshot) => {
      const nextTasks = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { id: doc.id, ...data };
      });
      setTasks(nextTasks);
    });
    return stopListening;
  }, [uid]);

  if (visibleTasks.length === 0) {
    return (
      <div>
        <div className="mb-3">
          <button onClick={regenPlan} className="text-purple-700 underline">
            Regenerate Plan
          </button>
        </div>
        <p className="text-sm text-gray-500">No tasks yet.</p>
      </div>
    );
  }

  function deleteTask(id: string) {
    const taskRef = doc(db, "users", uid, "tasks", id); // points to the selected task
    if (confirm("Delete this task?")) { // shows a popup so no accidental deleted tasks
      deleteDoc(taskRef)
    }
  }

  function saveEdit(id: string) {
    const taskRef = doc(db, "users", uid, "tasks", id);
    updateDoc(taskRef, {
      name: editName || null,
      category: editCategory || null,
      priority: editPriority || "Medium",
      estMinutes: editMinutes === "" ? null : Number(editMinutes),
      dueAt: inputDateToTimestamp(editDueAt),
    });
    setEditingId(null);
  }

  function tsToInputDate(ts?: Timestamp | null) {
    if (!ts) return "";
    const d = ts.toDate();
    return d.toISOString().slice(0, 10); // Returns in YYYY-MM-DD format
  }

  function inputDateToTimestamp(val: string) {
    return val ? Timestamp.fromDate(new Date(val)) : null;
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setEditName(t.name ?? "");
    setEditCategory(t.category ?? "");
    setEditPriority((t.priority as "Low" | "Medium" | "High") ?? "Medium");
    setEditMinutes(t.estMinutes != null ? String(t.estMinutes) : "");
    setEditDueAt(tsToInputDate(t.dueAt ?? null));
  }

  async function markComplete(id: string) {
    const ref = doc(db, "users", uid, "tasks", id); // Flips the status to complted 
    await updateDoc(ref, { status: "completed", completedAt: serverTimestamp() });
    await logEvent(uid, "complete", { taskId: id, details: "Marked complete from TaskList" }); // Logs the event
  }

  async function reschedule(id: string) {
    const ref = doc(db, "users", uid, "tasks", id);
    await updateDoc(ref, { status: "pending", scheduledStart: null, scheduledEnd: null, scheduleSource: null, });
    await logEvent(uid, "reschedule", { taskId: id, details: "Requested reschedule" });
  }

  function regenPlan() {
    onRegenerate?.();
    logEvent(uid, "regenerate", { details: "Regenerate plan clicked" });
  }


  return (
    <div>
      <div className="mb-3">
        <button onClick={regenPlan} className="text-purple-700 underline">Regenerate plan</button>
      </div>

      <ul className="space-y-2">
        {visibleTasks.map((t) => (
          <li key={t.id} className="border border-gray-200 bg-white rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-center">
              {editingId === t.id ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-wrap items-center gap-2 flex-1">

                    <input // Edit name input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border px-2 py-1 rounded"
                      placeholder="Task name">
                    </input>

                    <input // Edit category input
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="border px-2 py-1 rounded"
                      placeholder="Task name">
                    </input>

                    <select // Edit priority input
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as "Low" | "Medium" | "High")}
                      className="border px-2 py-1 rounded">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>

                    <input // Edit minutes input
                      type="number"
                      min="0"
                      value={editMinutes}
                      onChange={(e) => setEditMinutes(e.target.value)}
                      className="border px-2 py-1 w-24 rounded"
                      placeholder="mins">
                    </input>

                    <input // Edit due date input
                      type="date"
                      value={editDueAt}
                      onChange={(e) => setEditDueAt(e.target.value)}
                      className="border px-2 py-1 rounded">
                    </input>
                  </div>
                  <button onClick={() => saveEdit(t.id)} className="text-blue-600">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 mr-2">Cancel</button>
                  <button onClick={() => deleteTask(t.id)} className="text-red-500 ml-auto">Delete</button>
                </div>
              ) : (
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-800">{t.name}</span> {/*Wrap task name in span to only apply styling to name*/}
                  <div className="flex items-center gap-3">
                    <button onClick={() => markComplete(t.id)} className="text-green-600">Complete</button>
                    <button onClick={() => reschedule(t.id)} className="text-blue-600">Reschedule</button>
                    <button onClick={() => startEdit(t)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteTask(t.id)} className="text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {(t.category || "General")} | {(t.priority || "Medium")}
              {t.estMinutes ? ` | ${t.estMinutes} min` : ""}
            </div>
          </li>
        ))
        }
      </ul >
    </div>

  );
}
