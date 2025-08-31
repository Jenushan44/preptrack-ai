import "../globals.css";
import TaskList from "@/components/TaskList";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <header className="sticky top-0 z-20 bg-gray-900 px-6 py-4 text-white shadow">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="font-bold text-lg">PrepTrack AI</div>
          <button className="rounded bg-white px-3 py-1 text-sm text-blue-600 hover:bg-gray-100">
            Login / Logout
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}

