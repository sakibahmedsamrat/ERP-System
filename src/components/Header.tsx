'use client'

import { usePathname } from 'next/navigation';
import { Search, UserCircle, LogOut, Menu } from 'lucide-react';
import { logoutAction } from '@/app/logout/actions';
import NotificationBell from './NotificationBell';

export default function Header({ 
  user,
  onToggleMobileSidebar
}: { 
  user?: any;
  onToggleMobileSidebar?: () => void;
}) {
  const pathname = usePathname();
  
  // Format the current path nicely
  const getPageTitle = () => {
    if (!pathname || pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/workers/recycle-bin')) return 'Employee Recycle Bin';
    if (pathname.startsWith('/workers')) return 'Employees';
    if (pathname.startsWith('/confirmations')) return 'Employee Confirmation';
    if (pathname.startsWith('/id-cards')) return 'ID Card Generator';
    if (pathname.startsWith('/payroll/salary-statement') || pathname.startsWith('/salary-statement')) return 'Salary Statement';
    if (pathname.startsWith('/payroll/settlements') || pathname.startsWith('/settlements')) return 'Settlements';
    if (pathname.startsWith('/payroll')) return 'Payroll Management';
    if (pathname.startsWith('/recruitment/manpower')) return 'Manpower Entry';
    if (pathname.startsWith('/recruitment')) return 'Recruitment & Manpower';
    if (pathname.startsWith('/attendance')) return 'Attendance';
    if (pathname.startsWith('/companies')) return 'Companies';
    if (pathname.startsWith('/tasks')) return 'Task Management';
    if (pathname.startsWith('/training')) return 'Training Schedules';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/activity-logs')) return 'Activity Logs';
    if (pathname.startsWith('/settings')) return 'Account Settings';
    const path = pathname.split('/')[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
  };

  return (
    <header className="glass-header sticky top-0 z-30 print:hidden">
      <div className="flex justify-between items-center px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white/40 hover:bg-white/80 border border-white/60 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{getPageTitle()}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="pl-9 pr-4 py-2 bg-white/60 hover:bg-white/90 border border-slate-200/70 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-full text-sm outline-none transition-all w-64 shadow-xs"
            />
          </div>
          
          <NotificationBell />
          
          <div className="h-6 w-px bg-slate-200/70 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs sm:text-sm font-bold text-slate-800">{user?.name || 'User'}</span>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {user?.role || 'Guest'}
              </span>
            </div>
            {user?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt="Profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm ring-2 ring-white border border-slate-200" />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md ring-2 ring-white/80">
                <UserCircle size={22} />
              </div>
            )}
            <form action={logoutAction} className="ml-1 sm:ml-2">
              <button 
                title="Logout" 
                type="submit" 
                className="text-slate-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50/80 border border-transparent hover:border-red-100"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
