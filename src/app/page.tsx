import { Users, Building2, CalendarCheck, CheckSquare } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

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
  const totalTasks = await prisma.task.count();
  const todayAttendanceCount = await prisma.attendance.count({
    where: { status: 'PRESENT' }
  });

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
            <div key={idx} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`p-4 rounded-full ${card.bg}`}>
                <Icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to {process.env.NEXT_PUBLIC_APP_NAME || 'HR Module'}</h2>
        <p className="text-gray-600">
          This is the dashboard. Use the sidebar to navigate to different modules:
          Employees, Companies, Attendance, and more. 
        </p>
      </div>
    </div>
  );
}
