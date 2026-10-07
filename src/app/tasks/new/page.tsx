import { createTask } from '../actions';
import Link from 'next/link';

export default function NewTaskPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Assign New Task</h1>
        <Link href="/tasks" className="text-blue-600 hover:underline">
          &larr; Back to Tasks
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form action={createTask} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              id="description" 
              name="description" 
              rows={4}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input 
              type="date" 
              id="deadline" 
              name="deadline" 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
