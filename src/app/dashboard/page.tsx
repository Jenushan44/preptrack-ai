"use client";
import { useState } from "react";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import ProgressTracker from "@/components/ProgressTracker";
import AISchedule from "@/components/AISchedule";
import PrefForm from "@/components/PrefForm";

export default function DashboardPage() {
  const uid = "demo-user";
  const [scheduleTrigger, setScheduleTrigger] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">Plan, track, and tune your study/work sessions.</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-800 p-5 shadow">
        <h3 className="mb-3 text-lg font-semibold text-white">Add a Task</h3>
        <TaskForm uid={uid} />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-800 p-5 shadow">
        <h3 className="mb-3 text-lg font-semibold text-white">Your Tasks</h3>
        <TaskList uid={uid} onRegenerate={() => setScheduleTrigger((n) => n + 1)} />      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-800 p-5 shadow">
        <h3 className="mb-3 text-lg font-semibold text-white">AI Schedule</h3>
        <AISchedule uid={uid} trigger={scheduleTrigger} />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-800 p-5 shadow">
        <h3 className="mb-3 text-lg font-semibold text-white">Progress</h3>
        <ProgressTracker />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-800 p-5 shadow">
        <h3 className="mb-3 text-lg font-semibold text-white">Scheduling Preferences</h3>
        <PrefForm uid={uid} />
      </div>
    </div>
  );
}
