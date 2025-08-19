"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function PrefForm({ uid }: { uid: string }) {

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [targetHours, setTargetHours] = useState<string>("3.0");

  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { // Used to load any exisiting preferences 
    async function loadPref() {
      const ref = doc(db, "users", uid, "prefs", "default");
      const info = await getDoc(ref);
      if (info.exists()) {
        const data = info.data() as any;
        if (data.startTime) setStartTime(data.startTime);
        if (data.endTime) setEndTime(data.endTime);
        if (data.targetHoursPerDay != null) setTargetHours(String(data.targetHoursPerDay));
      }
      setLoaded(true);
    }
    loadPref();
  }, [uid]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const ref = doc(db, "users", uid, "prefs", "default");
    await setDoc(ref, {
      startTime,
      endTime,
      targetHoursPerDay: targetHours === "" ? null : Number(targetHours),
      updatedAt: serverTimestamp()
    });
    setSaving(false);


  }

  return (
    <form onSubmit={onSave} className="rounded-2xl border bg-white space-y-4 p-5 shadow-sm">
      <h2 className="text-gray-800 text-lg font-semibold">Scheduling Preferences</h2>

      <div>
        <label className="text-gray-700 mb-1 text-sm block">Start time</label>
        <input
          type="time"
          className="border w-full rounded text-gray-800 px-3 py-2"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        ></input>
      </div>

      <div>
        <label className=" block text-gray-700 mb-1 text-sm block">End time</label>
        <input
          type="time"
          className="border w-full rounded text-gray-800 px-3 py-2"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        ></input>
      </div>

      <div>
        <label className="text-gray-700 text-sm block mb-1">Target hours per day</label>
        <input
          type="number"
          step={0.5}
          className="w-full border rounded py-2 text-gray-800 px-3"
          min={0}
          value={targetHours}
          onChange={(e) => {
            const v = e.target.value;
            setTargetHours(v == "" ? "" : v)
          }}
        ></input>
      </div>

      <button className="bg-gray-800 px-4 text-white py-2 rounded" disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </button>

    </form>
  );
}