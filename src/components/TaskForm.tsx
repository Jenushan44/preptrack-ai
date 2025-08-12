"use client"

export default function TaskForm({ uid }: { uid: string }) {

  // Function runs when the form is submitted 
  // React.FormEvent tells TypeScript that this is a form submit event and to only provide form-related methods

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
  }
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-white shadow-sm space-y-4 p-5">
      <h2 className="text-gray-800 text-lg font-semibold">Add a Task</h2>
      <button className="bg-gray-400 text-white px-4 rounded py-2">
        Add Task
      </button>
    </form>

  );
}
