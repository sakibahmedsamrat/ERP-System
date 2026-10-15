'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Settings,
  Activity,
  Layers,
  Sliders
} from 'lucide-react';
import { logoutAction } from '@/app/logout/actions';

export default function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'HR Module';
  
  const hasModule = (modName: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  const employeesHref = hasModule('WORKERS') 
    ? '/workers' 
    : (hasModule('CONFIRMATIONS') ? '/confirmations' : (hasModule('IDCARD') ? '/id-cards' : '/workers'));

  const NavItem = ({ href, icon: Icon, label, color = "text-white", exact = false }: any) => {
    let isActive = false;
    if (exact) {
      isActive = pathname === href;
    } else if (href === '/recruitment') {
      isActive = pathname === '/recruitment' || (pathname.startsWith('/recruitment') && !pathname.startsWith('/recruitment/manpower'));
    } else if (label === 'Employees' || href === '/workers' || href === employeesHref) {
      isActive = pathname.startsWith('/workers') || pathname.startsWith('/confirmations') || pathname.startsWith('/id-cards');
    } else {
      isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    }

    return (
      <Link 
        href={href} 
        prefetch={true}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium ${
          isActive 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 translate-x-1' 
            : `hover:bg-white/10 ${color} hover:translate-x-1`
        }`}
      >
        <Icon size={18} className={isActive ? 'text-white' : 'opacity-80'} /> 
        <span className="text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="w-72 bg-[#0F172A] text-white h-screen shrink-0 flex flex-col print:hidden shadow-2xl relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none"></div>
      
      <div className="p-6 font-extrabold text-2xl border-b border-white/10 flex items-center gap-3 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
          <Layers size={18} className="text-white" />
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          {appName}
        </span>
      </div>
      
      <nav className="flex-1 p-5 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
        <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
        
        {(hasModule('WORKERS') || hasModule('CONFIRMATIONS') || hasModule('IDCARD')) && (
          <NavItem href={employeesHref} icon={Users} label="Employees" />
        )}
        {hasModule('COMPANIES') && <NavItem href="/companies" icon={Building2} label="Companies" />}
        {hasModule('ATTENDANCE') && <NavItem href="/attendance" icon={CalendarCheck} label="Attendance" />}
        {hasModule('SETTLEMENTS') && <NavItem href="/settlements" icon={CreditCard} label="Settlements" />}
        {hasModule('TRAINING') && <NavItem href="/training" icon={GraduationCap} label="Training" />}
        {hasModule('RECRUITMENT') && (
          <div className="space-y-1">
            <NavItem href="/recruitment" icon={Briefcase} label="Recruitment" />
            <NavItem href="/recruitment/manpower" icon={Sliders} label="Manpower Entry" color="text-blue-200" />
          </div>
        )}
        {hasModule('TASKS') && <NavItem href="/tasks" icon={CheckSquare} label="Tasks" />}
        
        <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-bold px-4 mb-2">Admin</div>
          {user?.role === 'SUPER_ADMIN' && (
            <>
              <NavItem href="/users" icon={Shield} label="User Management" color="text-blue-300" />
              <NavItem href="/activity-logs" icon={Activity} label="Activity Logs" color="text-emerald-300" />
            </>
          )}
          <NavItem href="/settings" icon={Settings} label="Settings" color="text-gray-300" />
        </div>
      </nav>
      
      {/* We removed the bottom logout form since it's in the Header now. */}
    </div>
  );
}



