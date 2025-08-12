"use client"
import { useState } from "react"; // Allows components to remember values between renders

export default function TaskForm({ uid }: { uid: string }) {
  const [name, setName] = useState("");


  // Function runs when the form is submitted 
  // React.FormEvent tells TypeScript that this is a form submit event 
  // and to only provide form-related methods

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
  }
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-white shadow-sm space-y-4 p-5">
      <h2 className="text-gray-800 text-lg font-semibold">Add a Task</h2>

      <input className="border w-full rounded py-2 px-3 text-gray-800" placeholder="Task name" value={name} onChange={(event) => setName(event.target.value)}></input>

      <button className="bg-gray-400 text-white px-4 rounded py-2">
        Add Task
      </button>
    </form>
  );
}
