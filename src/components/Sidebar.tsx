'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Sliders,
  Banknote,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { logoutAction } from '@/app/logout/actions';

export default function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'HR Module';
  
  const hasModule = (modName: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  const currentPath = pathname || '';
  const normalizedPath = currentPath.replace(/\/$/, '') || '/';

  const isPayrollChildRoute = 
    normalizedPath === '/settlements' || 
    normalizedPath.startsWith('/settlements/') || 
    normalizedPath === '/payroll/settlements' || 
    normalizedPath.startsWith('/payroll/settlements/') || 
    normalizedPath === '/salary-statement' || 
    normalizedPath.startsWith('/salary-statement/') || 
    normalizedPath === '/payroll/salary-statement' || 
    normalizedPath.startsWith('/payroll/salary-statement/');

  const isPayrollExactActive = normalizedPath === '/payroll';
  const isPayrollSection = isPayrollChildRoute || isPayrollExactActive;

  const [isPayrollOpen, setIsPayrollOpen] = useState(isPayrollSection);

  const isRecruitmentChildRoute = 
    (normalizedPath.startsWith('/recruitment/') && normalizedPath !== '/recruitment') ||
    normalizedPath === '/recruitment/manpower' || 
    normalizedPath === '/recruitment/new';

  const isRecruitmentExactActive = normalizedPath === '/recruitment';
  const isRecruitmentSection = isRecruitmentChildRoute || isRecruitmentExactActive;
  const isRecruitmentParentActive = normalizedPath === '/recruitment' && currentTab !== 'jobs' && currentTab !== 'entry';

  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(isRecruitmentSection);
  const prevRef = useRef({ path: normalizedPath, tab: currentTab });

  useEffect(() => {
    const pathChanged = prevRef.current.path !== normalizedPath;
    const tabChanged = prevRef.current.tab !== currentTab;

    if (pathChanged || tabChanged) {
      if (pathChanged) {
        if (isPayrollChildRoute || isPayrollExactActive) {
          setIsPayrollOpen(true);
        } else {
          setIsPayrollOpen(false);
        }
      }

      if (isRecruitmentChildRoute || isRecruitmentExactActive) {
        if (pathChanged || (tabChanged && (currentTab === 'jobs' || currentTab === 'entry'))) {
          setIsRecruitmentOpen(true);
        }
      } else {
        setIsRecruitmentOpen(false);
      }

      prevRef.current = { path: normalizedPath, tab: currentTab };
    }
  }, [
    normalizedPath, 
    currentTab, 
    isPayrollChildRoute, 
    isPayrollExactActive, 
    isRecruitmentChildRoute, 
    isRecruitmentExactActive
  ]);

  const employeesHref = hasModule('WORKERS') 
    ? '/workers' 
    : (hasModule('CONFIRMATIONS') ? '/confirmations' : (hasModule('IDCARD') ? '/id-cards' : '/workers'));

  const NavItem = ({ href, icon: Icon, label, color = "text-white", exact = false, tabIndex }: any) => {
    let isActive = false;
    if (exact) {
      isActive = normalizedPath === href;
    } else if (label === 'Manpower Entry' || href === '/recruitment/manpower') {
      isActive = 
        normalizedPath === '/recruitment/manpower' || 
        normalizedPath.startsWith('/recruitment/manpower/') || 
        (normalizedPath === '/recruitment' && currentTab === 'entry');
    } else if (label === 'Job Circulars' || href === '/recruitment?tab=jobs') {
      isActive = 
        (normalizedPath === '/recruitment' && currentTab === 'jobs') || 
        normalizedPath === '/recruitment/new' || 
        normalizedPath.startsWith('/recruitment/new/');
    } else if (href === '/recruitment') {
      isActive = isRecruitmentParentActive;
    } else if (label === 'Settlements' || href === '/payroll/settlements' || href === '/settlements') {
      isActive = normalizedPath === '/settlements' || normalizedPath.startsWith('/settlements/') || normalizedPath === '/payroll/settlements' || normalizedPath.startsWith('/payroll/settlements/');
    } else if (label === 'Salary Statement' || href === '/payroll/salary-statement' || href === '/salary-statement') {
      isActive = normalizedPath === '/salary-statement' || normalizedPath.startsWith('/salary-statement/') || normalizedPath === '/payroll/salary-statement' || normalizedPath.startsWith('/payroll/salary-statement/');
    } else if (label === 'Employees' || href === '/workers' || href === employeesHref) {
      isActive = normalizedPath.startsWith('/workers') || normalizedPath.startsWith('/confirmations') || normalizedPath.startsWith('/id-cards');
    } else {
      isActive = normalizedPath === href || (href !== '/' && normalizedPath.startsWith(href));
    }

    return (
      <Link 
        href={href} 
        prefetch={true}
        tabIndex={tabIndex}
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
        {(hasModule('PAYROLL') || hasModule('SETTLEMENTS')) && (
          <div className="space-y-1">
            <div
              className={`group flex items-center justify-between rounded-xl transition-all duration-300 font-medium ${
                isPayrollExactActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 translate-x-1'
                  : 'hover:bg-white/10 text-white hover:translate-x-1'
              }`}
            >
              <Link
                href="/payroll"
                prefetch={true}
                onClick={(e) => {
                  if (normalizedPath === '/payroll') {
                    e.preventDefault();
                    setIsPayrollOpen((prev) => !prev);
                  } else {
                    setIsPayrollOpen(true);
                  }
                }}
                className="flex items-center gap-3 px-4 py-2.5 flex-1 min-w-0"
              >
                <Banknote size={18} className={isPayrollExactActive ? 'text-white' : 'opacity-80'} />
                <span className="text-sm">Payroll</span>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPayrollOpen((prev) => !prev);
                }}
                aria-label={isPayrollOpen ? 'Collapse Payroll sub-menu' : 'Expand Payroll sub-menu'}
                aria-expanded={isPayrollOpen}
                aria-controls="payroll-submenu"
                title={isPayrollOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                className={`self-stretch px-3.5 flex items-center justify-center rounded-r-xl transition-colors cursor-pointer ${
                  isPayrollExactActive
                    ? 'hover:bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-in-out ${
                    isPayrollOpen ? 'rotate-180 text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
              </button>
            </div>

            <div
              id="payroll-submenu"
              aria-hidden={!isPayrollOpen}
              className={`grid transition-all duration-300 ease-in-out ${
                isPayrollOpen
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pl-4 space-y-1 border-l border-white/10 ml-5 py-1">
                  <NavItem
                    href="/payroll/settlements"
                    icon={CreditCard}
                    label="Settlements"
                    color="text-slate-300"
                    tabIndex={isPayrollOpen ? 0 : -1}
                  />
                  <NavItem
                    href="/payroll/salary-statement"
                    icon={FileSpreadsheet}
                    label="Salary Statement"
                    color="text-slate-300"
                    tabIndex={isPayrollOpen ? 0 : -1}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {hasModule('TRAINING') && <NavItem href="/training" icon={GraduationCap} label="Training" />}
        {hasModule('RECRUITMENT') && (
          <div className="space-y-1">
            <div
              className={`group flex items-center justify-between rounded-xl transition-all duration-300 font-medium ${
                isRecruitmentParentActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 translate-x-1'
                  : 'hover:bg-white/10 text-white hover:translate-x-1'
              }`}
            >
              <Link
                href="/recruitment"
                prefetch={true}
                onClick={(e) => {
                  if (normalizedPath === '/recruitment') {
                    if (isRecruitmentParentActive) {
                      e.preventDefault();
                      setIsRecruitmentOpen((prev) => !prev);
                    } else {
                      setIsRecruitmentOpen(true);
                    }
                  } else {
                    setIsRecruitmentOpen(true);
                  }
                }}
                className="flex items-center gap-3 px-4 py-2.5 flex-1 min-w-0"
              >
                <Briefcase size={18} className={isRecruitmentParentActive ? 'text-white' : 'opacity-80'} />
                <span className="text-sm">Recruitment</span>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsRecruitmentOpen((prev) => !prev);
                }}
                aria-label={isRecruitmentOpen ? 'Collapse Recruitment sub-menu' : 'Expand Recruitment sub-menu'}
                aria-expanded={isRecruitmentOpen}
                aria-controls="recruitment-submenu"
                title={isRecruitmentOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                className={`self-stretch px-3.5 flex items-center justify-center rounded-r-xl transition-colors cursor-pointer ${
                  isRecruitmentParentActive
                    ? 'hover:bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-in-out ${
                    isRecruitmentOpen ? 'rotate-180 text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
              </button>
            </div>

            <div
              id="recruitment-submenu"
              aria-hidden={!isRecruitmentOpen}
              className={`grid transition-all duration-300 ease-in-out ${
                isRecruitmentOpen
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pl-4 space-y-1 border-l border-white/10 ml-5 py-1">
                  <NavItem
                    href="/recruitment/manpower"
                    icon={Sliders}
                    label="Manpower Entry"
                    color="text-slate-300"
                    tabIndex={isRecruitmentOpen ? 0 : -1}
                  />
                  <NavItem
                    href="/recruitment?tab=jobs"
                    icon={Briefcase}
                    label="Job Circulars"
                    color="text-slate-300"
                    tabIndex={isRecruitmentOpen ? 0 : -1}
                  />
                </div>
              </div>
            </div>
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



