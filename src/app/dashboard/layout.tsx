import Sidebar from "@/components/Sidebar";
import "../globals.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">{children}</div>
    </div>
  );
}