import { Users, Building2, CalendarCheck, CheckSquare, Clock } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { formatDate } from '@/lib/formatDate';
import { getSession } from '@/lib/auth';
import { markTaskDone } from './tasks/actions';

const prisma = new PrismaClient();

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

  const totalWorkers = await prisma.worker.count();
  const totalCompanies = await prisma.company.count();
  let taskWhere: any = {};
  if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    taskWhere = {
      OR: [
        { assigneeId: user.id },
        { creatorId: user.id }
      ]
    };
  }
  const totalTasks = await prisma.task.count({ where: taskWhere });
  const todayAttendanceCount = await prisma.attendance.count({
    where: { status: 'PRESENT' }
  });

  const myTasks = user ? await prisma.task.findMany({
    where: { assigneeId: user.id, status: { not: 'DONE' } },
    orderBy: { deadline: 'asc' },
    take: 5
  }) : [];

  const cards = [
    { title: "Total Employees", value: totalWorkers, icon: Users, color: "text-blue-600", bg: "bg-blue-100", mod: 'WORKERS' },
    { title: "Active Companies", value: totalCompanies, icon: Building2, color: "text-green-600", bg: "bg-green-100", mod: 'COMPANIES' },
    { title: "Present Today", value: todayAttendanceCount, icon: CalendarCheck, color: "text-purple-600", bg: "bg-purple-100", mod: 'ATTENDANCE' },
    { title: "Total Tasks", value: totalTasks, icon: CheckSquare, color: "text-orange-600", bg: "bg-orange-100", mod: 'TASKS' },
  ].filter(card => hasModule(card.mod));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer group">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 group-hover:text-blue-600 transition-colors">{card.title}</p>
                <p className="text-3xl font-extrabold text-gray-800">{card.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-2xl font-bold mb-4 relative z-10">Welcome back to {process.env.NEXT_PUBLIC_APP_NAME || 'HR Module'}</h2>
          <p className="text-blue-100 mb-6 relative z-10 leading-relaxed">
            Your centralized dashboard for managing employees, companies, tracking attendance, and handling tasks efficiently.
          </p>
          <div className="flex gap-3 relative z-10">
            <button className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-sm">
              View Reports
            </button>
            <button className="bg-blue-800/50 text-white border border-blue-400/30 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-800/80 transition-colors backdrop-blur-sm">
              Quick Setup
            </button>
          </div>
        </div>

        {hasModule('TASKS') && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b border-gray-50">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <CheckSquare className="text-blue-600" size={18} /> 
              </div>
              My Assigned Tasks
            </h2>
            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending tasks assigned to you.</p>
              ) : (
                myTasks.map((task: any) => (
                  <div key={task.id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <h3 className="font-semibold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{task.title}</h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 shadow-sm border border-yellow-200">
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 pl-2">{task.description}</p>
                    )}
                    <div className="flex justify-between items-end mt-3 pl-2 pt-3 border-t border-gray-200/60">
                      {task.deadline ? (
                        <div className="text-xs font-semibold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                          <Clock size={12} /> 
                          {formatDate(task.deadline)}
                        </div>
                      ) : <div />}
                      <form action={markTaskDone.bind(null, task.id)}>
                        <button type="submit" className="text-sm bg-white border border-gray-200 shadow-sm text-gray-700 font-medium px-4 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-1">
                          <CheckSquare size={14} /> Mark Done
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



