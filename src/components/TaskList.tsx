"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";

type Task = {
  id: string;
  name?: string;
  category?: string;
  priority?: string;
  estMinutes?: number | null;
  status?: string;
};

export default function TaskList({ uid }: { uid: string }) {
  const [tasks, setTasks] = useState<Task[]>([]); // Used to hold all tasks read from Firestore 
  const [editingId, setEditingId] = useState<string | null>(null); // Task being edited 
  const [editName, setEditName] = useState("");

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

  if (tasks.length === 0) {
    return <p className="text-sm text-gray-500">No tasks yet.</p>;
  }

  function deleteTask(id: string) {
    const taskRef = doc(db, "users", uid, "tasks", id); // points to the selected task
    if (confirm("Delete this task?")) { // shows a popup so no accidental deleted tasks
      deleteDoc(taskRef)
    }
  }

  function saveEdit(id: string) {
    const taskRef = doc(db, "users", uid, "tasks", id);
    updateDoc(taskRef, { name: editName });
    setEditingId(null);
  }

  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="border rounded-xl p-3">
          <div className="flex justify-between items-center">
            {editingId === t.id ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border px-2 py-1 rounded flex-1 mr-3" placeholder="Task name"></input>
                  <button onClick={() => saveEdit(t.id)} className="text-blue-600">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 mr-2">Cancel</button>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-red-500 ml-auto">Delete</button>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <span className="font-medium text-gray-500">{t.name}</span> {/*Wrap task name in span to only apply styling to name*/}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditingId(t.id); setEditName(t.name ?? ""); }}
                    className="text-blue-600 ml-185">
                    Edit
                  </button>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-red-500">Delete</button>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-600">
            {(t.category || "General")} | {(t.priority || "Medium")}
            {t.estMinutes ? ` | ${t.estMinutes} min` : ""}
          </div>
        </li>
      ))
      }
    </ul >
  );
}
