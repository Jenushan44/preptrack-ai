"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

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
    const tasksQuery = query(tasksRef, orderBy("createdAt", "desc")); // Create a query that is order by createdAt, newest first 

    const stopListening = onSnapshot(tasksQuery, (snapshot) => { // new snapshot created when anything changes
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

  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="border rounded-xl p-3">
          <div className="font-medium">{t.name || "(no name)"}</div>
          <div className="text-xs text-gray-600">
            {(t.category || "General")} | {(t.priority || "Medium")}
            {t.estMinutes ? ` | ${t.estMinutes} min` : ""}
          </div>
        </li>
      ))}
    </ul>
  );
}
