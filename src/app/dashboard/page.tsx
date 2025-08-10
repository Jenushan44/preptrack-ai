
import TaskList from '../../components/TaskList';

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-gray-800 text-2xl font-semibold">Dashboard section</h2>
      <p className="text-gray-700 mt-2">Example text</p>
      <TaskList />
    </div>
  );
}
