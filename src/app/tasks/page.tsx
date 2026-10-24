import prisma from '@/lib/prisma';
import Link from 'next/link';
import { formatDate } from '@/lib/formatDate';
import { Plus, Clock, Trash2, CheckCircle, CheckSquare, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { deleteTask, markTaskDone } from './actions';

export default async function TasksPage() {
  const session = await getSession();
  const user = session?.user;

  let whereClause = {};
  if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Workflow &amp; Action Items</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Task Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Assign, track, and resolve team operational responsibilities
          </p>
        </div>
        {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
          <Link 
            href="/tasks/new" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 w-fit"
          >
            <Plus size={18} /> Assign Task
          </Link>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card rounded-3xl shadow-sm p-12 text-center text-slate-500 border border-white/70">
          <CheckSquare size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No tasks currently registered</h3>
          <p className="text-xs text-slate-400 mt-1">Assign new tasks to team members to start tracking progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task: any) => (
            <div 
              key={task.id} 
              className="glass-card glass-card-hover rounded-3xl p-6 border border-white/70 shadow-sm flex flex-col relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-slate-900 pr-16 group-hover:text-blue-600 transition-colors">
                  {task.title}
                </h2>
                <span className={`absolute top-6 right-6 text-[11px] px-2.5 py-0.5 rounded-full font-bold border shadow-xs ${
                  task.status === 'DONE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {task.status}
                </span>
              </div>
              
              <p className="text-slate-600 text-xs flex-1 mb-5 leading-relaxed">{task.description}</p>
              
              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-200/60">
                {task.assignee && (
                  <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Assignee: {task.assignee.name}</span>
                  </div>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-100 w-fit">
                    <Clock size={13} /> 
                    <span>Deadline: {formatDate(task.deadline)}</span>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                  {task.status !== 'DONE' && (
                    <form action={markTaskDone.bind(null, task.id)}>
                      <button 
                        type="submit" 
                        className="flex items-center gap-1 text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 px-3 py-1.5 rounded-xl transition shadow-xs"
                      >
                        <CheckCircle size={14} /> Done
                      </button>
                    </form>
                  )}
                  {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <form action={deleteTask.bind(null, task.id)}>
                      <button 
                        type="submit" 
                        className="flex items-center gap-1 text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 px-3 py-1.5 rounded-xl transition shadow-xs"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
