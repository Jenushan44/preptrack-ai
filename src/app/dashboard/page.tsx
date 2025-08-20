"use client";

import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import ProgressTracker from "@/components/ProgressTracker";
import AISchedule from "@/components/AISchedule";
import PrefForm from "@/components/PrefForm";

export default function DashboardPage() {
  const uid = "demo-user";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-800 text-2xl font-semibold">Dashboard section</h2>
        <p className="text-gray-700 mt-2">Example text</p>
      </div>

      <TaskForm uid={uid} />

      <div className="rounded-2xl border bg-white shadow-sm p-5">
        <h3 className="text-gray-800 mb-3 text-lg font-semibold">Your Tasks</h3>
        <TaskList uid={uid} />
      </div>

      <AISchedule uid={uid} />
      <ProgressTracker />
      <PrefForm uid={uid} />
    </div>
  );
}
