import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus, Clock } from 'lucide-react';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function TasksPage() {
  const session = await getSession();
  const user = session?.user;

  let whereClause = {};
  if (user && user.role !== 'SUPER_ADMIN') {
    whereClause = {
      OR: [
        { assigneeId: user.id },
        { creatorId: user.id }
      ]
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { assignee: true }
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

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500 border border-gray-100">
          No tasks found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task: any) => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-800 pr-16">{task.title}</h2>
                <span className={`absolute top-6 right-6 text-xs px-2 py-1 rounded-full font-bold ${
                  task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.status}
                </span>
              </div>
              
              <p className="text-gray-600 flex-1 mb-4">{task.description}</p>
              
              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-50">
                {task.assignee && (
                  <div className="text-sm font-medium text-indigo-600">
                    Assignee: {task.assignee.name}
                  </div>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-1 text-sm text-red-600 font-medium">
                    <Clock size={16} /> 
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
