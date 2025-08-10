// will display real tasks from Firestore 

export default function TaskList() {
  return (
    <section className="rounded-2xl border p-5 shadow-sm bg-white">
      <h2 className="text-lg font-semibold text-gray-800">Your Tasks</h2>
      <ul className="mt-4 space-y-2">
        <li className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-800">Sample Task 1</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">High Priority</span>
        </li>
        <li className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-800">Sample Task 2</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">Medium Priority</span>
        </li>


      </ul>
    </section>
  )
}