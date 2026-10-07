import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus, Clock } from 'lucide-react';

const prisma = new PrismaClient();

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
        <Link 
          href="/tasks/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Assign Task
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 flex-1">{task.description}</p>
            
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={16} /> 
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
              </span>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="col-span-full bg-white p-8 text-center rounded-xl shadow-sm text-gray-500">
            No tasks found.
          </div>
        )}
      </div>
    </div>
  );
}
