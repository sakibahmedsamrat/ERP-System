import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CalendarCheck, 
  CreditCard,
  GraduationCap,
  Briefcase,
  CheckSquare,
  Shield,
  Settings
} from 'lucide-react';
import { logoutAction } from '@/app/logout/actions';

export default function Sidebar({ user }: { user?: any }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'HR Module';
  
  const hasModule = (modName: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col print:hidden">
      <div className="p-5 font-bold text-2xl border-b border-gray-800 text-center">
        {appName}
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link href="/" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        
        {hasModule('WORKERS') && (
          <Link href="/workers" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <Users size={20} /> Employees
          </Link>
        )}
        
        {hasModule('COMPANIES') && (
          <Link href="/companies" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <Building2 size={20} /> Companies
          </Link>
        )}
        
        {hasModule('ATTENDANCE') && (
          <Link href="/attendance" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <CalendarCheck size={20} /> Attendance
          </Link>
        )}
        
        {hasModule('SETTLEMENTS') && (
          <Link href="/settlements" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <CreditCard size={20} /> Settlements
          </Link>
        )}
        
        {hasModule('TRAINING') && (
          <Link href="/training" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <GraduationCap size={20} /> Training
          </Link>
        )}
        
        {hasModule('RECRUITMENT') && (
          <Link href="/recruitment" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <Briefcase size={20} /> Recruitment
          </Link>
        )}
        
        {hasModule('TASKS') && (
          <Link href="/tasks" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <CheckSquare size={20} /> Tasks
          </Link>
        )}
        
        <div className="pt-4 mt-4 border-t border-gray-800">
          {user?.role === 'SUPER_ADMIN' && (
            <Link href="/users" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition text-blue-400">
              <Shield size={20} /> User Management
            </Link>
          )}
          <Link href="/settings" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition">
            <Settings size={20} /> Settings
          </Link>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
        <div className="text-sm text-gray-400 mb-2 truncate">
          Logged in as {user?.name || 'User'}
        </div>
        <form action={logoutAction}>
          <button type="submit" className="w-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition px-4 py-2 rounded flex items-center justify-center gap-2">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
