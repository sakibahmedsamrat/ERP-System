import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Users, Building2, CalendarCheck, CheckSquare, Clock, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { getSession } from '@/lib/auth';
import { markTaskDone } from './tasks/actions';

export default async function Dashboard() {
  const session = await getSession();
  const user = session?.user;
  
  const hasModule = (modName: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  let taskWhere: any = {};
  if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    taskWhere = {
      OR: [
        { assigneeId: user.id },
        { creatorId: user.id }
      ]
    };
  }
  
  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const [totalWorkers, totalCompanies, totalTasks, todayAttendanceCount, myTasks] = await Promise.all([
    prisma.worker.count({ where: { isDeleted: false } }),
    prisma.company.count(),
    prisma.task.count({ where: taskWhere }),
    prisma.attendance.count({
      where: {
        status: 'PRESENT',
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        worker: {
          isDeleted: false
        }
      }
    }),
    user ? prisma.task.findMany({
      where: { assigneeId: user.id, status: { not: 'DONE' } },
      select: { id: true, title: true, description: true, deadline: true, status: true },
      orderBy: { deadline: 'asc' },
      take: 5
    }) : Promise.resolve([])
  ]);

  const cards = [
    { title: "Total Employees", value: totalWorkers, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-200/50", href: "/workers", mod: 'WORKERS' },
    { title: "Active Companies", value: totalCompanies, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-200/50", href: "/companies", mod: 'COMPANIES' },
    { title: "Present Today", value: todayAttendanceCount, icon: CalendarCheck, color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-200/50", href: "/attendance", mod: 'ATTENDANCE' },
    { title: "Total Tasks", value: totalTasks, icon: CheckSquare, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-200/50", href: "/tasks", mod: 'TASKS' },
  ].filter(card => hasModule(card.mod));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-100/80 flex items-center gap-1.5 w-fit">
              <Sparkles size={12} />
              Enterprise Overview
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time indicators across workforce, operations, and active tasks</p>
        </div>
      </div>
      
      {/* Glass KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link 
              key={idx} 
              href={card.href}
              prefetch={true}
              className="glass-card glass-card-hover rounded-3xl p-6 flex items-center justify-between cursor-pointer group relative overflow-hidden"
            >
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
              </div>
              <div className={`p-4 rounded-2xl ${card.bg} border ${card.border} group-hover:scale-105 transition-transform duration-200 shadow-xs`}>
                <Icon className={`w-7 h-7 ${card.color}`} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Main Grid: Welcome Glass Banner & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Welcome Glass Card */}
        <div className="lg:col-span-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl shadow-xl shadow-indigo-900/10 p-8 text-white relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100 mb-4 border border-white/20">
              <Sparkles size={13} />
              <span>Workspace Portal</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight">
              Welcome back to {process.env.NEXT_PUBLIC_APP_NAME || 'HR Module'}
            </h2>
            <p className="text-blue-100/90 text-sm leading-relaxed mb-8 max-w-xl">
              Your centralized hub for workforce directory management, payroll settlement calculations, attendance tracking, and task execution.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link 
                href="/workers" 
                prefetch={true}
                className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm hover:shadow flex items-center gap-1.5"
              >
                <span>View Employees</span>
                <ArrowUpRight size={16} />
              </Link>
              <Link 
                href="/payroll" 
                prefetch={true}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors backdrop-blur-sm"
              >
                Payroll &amp; Settlements
              </Link>
            </div>
          </div>
        </div>

        {/* Assigned Tasks Glass Card */}
        {hasModule('TASKS') && (
          <div className="lg:col-span-6 glass-card rounded-3xl p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-200/50">
                  <CheckSquare size={18} /> 
                </div>
                <span>My Assigned Tasks</span>
              </h2>
              <Link 
                href="/tasks" 
                prefetch={true}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="space-y-3.5">
              {myTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">All tasks completed</p>
                  <p className="text-xs text-slate-400 mt-0.5">No pending tasks currently assigned to you.</p>
                </div>
              ) : (
                myTasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    className="p-4 bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 relative overflow-hidden group shadow-xs"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                    <div className="flex justify-between items-start mb-1.5 pl-2">
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h3>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 shadow-xs">
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-slate-600 text-xs mb-3 line-clamp-2 pl-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2 pl-2 pt-2.5 border-t border-slate-100">
                      {task.deadline ? (
                        <div className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-100">
                          <Clock size={12} /> 
                          <span>{formatDate(task.deadline)}</span>
                        </div>
                      ) : <div />}

                      <form action={markTaskDone.bind(null, task.id)}>
                        <button 
                          type="submit" 
                          className="text-xs bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200/80 hover:border-blue-600 font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <CheckSquare size={13} />
                          <span>Mark Done</span>
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
