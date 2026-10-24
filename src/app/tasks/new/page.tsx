import prisma from '@/lib/prisma';
import { createTask } from '../actions';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckSquare, Sparkles, User } from 'lucide-react';

export const metadata = {
  title: 'Assign New Task | HR ERP',
};

export default async function NewTaskPage() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, userId: true }, orderBy: { name: 'asc' } });
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Workflow &amp; Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assign New Task</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Delegate operational action items, deadlines, and responsibilities to team members
          </p>
        </div>
        <Link 
          href="/tasks" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Tasks
        </Link>
      </div>

      {/* Glass Card Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm">
        <form action={createTask} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CheckSquare size={14} className="text-blue-600" />
              <span>Task Title *</span>
            </label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required 
              placeholder="e.g. Audit Employee Salary Statements for May"
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description &amp; Instructions
            </label>
            <textarea 
              id="description" 
              name="description" 
              rows={4}
              placeholder="Detailed guidelines and expectations for this task..."
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            ></textarea>
          </div>

          <div>
            <label htmlFor="assigneeId" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-blue-600" />
              <span>Assign To (Optional)</span>
            </label>
            <select 
              id="assigneeId" 
              name="assigneeId" 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            >
              <option value="">-- Unassigned (Self / Pool) --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.userId})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" />
              <span>Deadline</span>
            </label>
            <input 
              type="date" 
              id="deadline" 
              name="deadline" 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2"
            >
              <CheckSquare size={16} />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
