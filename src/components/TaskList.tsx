"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { doc, deleteDoc } from "firebase/firestore"; // doc points to a specific document in Firestore and deleteDoc removes it

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

  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="border rounded-xl p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t.name || "(no name)"}</span> {/*Wrap task name in span to only apply styling to name*/}
            <button onClick={() => deleteTask(t.id)} className="text-red-500">Delete</button>
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
