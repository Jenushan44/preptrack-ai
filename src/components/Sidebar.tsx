"use client";

export default function Sidebar() {
  return (



    <div className="h-screen w-64 bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white flex flex-col p-6 space-y-6">
      <h1 className="text-2x1 font-bold">PrepTrack AI</h1>

      <nav className="flex flex-col space-y-4">

        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded transition">Title/Logo Placeholder</button>
        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded transition">Dashboard</button>
        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded transition">Tasks</button>
        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded transition">Planner</button>
        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded transition">Progress</button>
        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded transition">Settings</button>
      </nav>

      {/* mt-auto pushes this section (login/logout) to the bottom of the sidebar
          w-full makes the button stretch across the entire sidebar width*/}
      <div className="mt-auto">
        <button className="text-left hover:bg-red-500 px-3 py-2 rounded transition w-full">Login/Logout</button>
      </div>

    </div>
  );
}