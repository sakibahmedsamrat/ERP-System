'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Sliders,
  Banknote,
  FileSpreadsheet,
  ChevronDown,
  X
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: any;
  label: string;
  color?: string;
  isActive: boolean;
  tabIndex?: number;
  onClose?: () => void;
}

function NavItem({ href, icon: Icon, label, color = "text-slate-300", isActive, tabIndex, onClose }: NavItemProps) {
  return (
    <Link 
      href={href} 
      prefetch={true}
      tabIndex={tabIndex}
      onClick={() => {
        onClose?.();
      }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-150 text-sm font-medium ${
        isActive 
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/25 translate-x-1 font-semibold' 
          : `hover:bg-white/10 hover:text-white ${color} hover:translate-x-1`
      }`}
    >
      <Icon size={18} className={isActive ? 'text-white' : 'opacity-75'} /> 
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({ 
  user,
  isMobileOpen,
  onClose
}: { 
  user?: any;
  isMobileOpen?: boolean;
  onClose?: () => void;
}) {
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

  const isNavItemActive = (href: string, label: string, exact = false) => {
    if (exact) {
      return normalizedPath === href;
    }
    if (label === 'Manpower Entry' || href === '/recruitment/manpower') {
      return (
        normalizedPath === '/recruitment/manpower' || 
        normalizedPath.startsWith('/recruitment/manpower/') || 
        (normalizedPath === '/recruitment' && currentTab === 'entry')
      );
    }
    if (label === 'Job Circulars' || href === '/recruitment?tab=jobs') {
      return (
        (normalizedPath === '/recruitment' && currentTab === 'jobs') || 
        normalizedPath === '/recruitment/new' || 
        normalizedPath.startsWith('/recruitment/new/')
      );
    }
    if (href === '/recruitment') {
      return isRecruitmentParentActive;
    }
    if (label === 'Settlements' || href === '/payroll/settlements' || href === '/settlements') {
      return (
        normalizedPath === '/settlements' || 
        normalizedPath.startsWith('/settlements/') || 
        normalizedPath === '/payroll/settlements' || 
        normalizedPath.startsWith('/payroll/settlements/')
      );
    }
    if (label === 'Salary Statement' || href === '/payroll/salary-statement' || href === '/salary-statement') {
      return (
        normalizedPath === '/salary-statement' || 
        normalizedPath.startsWith('/salary-statement/') || 
        normalizedPath === '/payroll/salary-statement' || 
        normalizedPath.startsWith('/payroll/salary-statement/')
      );
    }
    if (label === 'Employees' || href === '/workers' || href === employeesHref) {
      return (
        normalizedPath.startsWith('/workers') || 
        normalizedPath.startsWith('/confirmations') || 
        normalizedPath.startsWith('/id-cards')
      );
    }
    return normalizedPath === href || (href !== '/' && normalizedPath.startsWith(href));
  };

  const renderNavItem = (
    href: string,
    icon: any,
    label: string,
    color = "text-slate-300",
    exact = false,
    tabIndex?: number
  ) => (
    <NavItem
      key={href}
      href={href}
      icon={icon}
      label={label}
      color={color}
      isActive={isNavItemActive(href, label, exact)}
      tabIndex={tabIndex}
      onClose={onClose}
    />
  );

  return (
    <>
      {/* Mobile backdrop overlay with frosted blur */}
      {isMobileOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside className={`w-72 bg-slate-950/95 backdrop-blur-md text-white h-screen shrink-0 flex flex-col print:hidden shadow-2xl relative overflow-hidden z-50 border-r border-slate-800/80 transition-transform duration-200 ease-in-out fixed inset-y-0 left-0 lg:static lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Subtle interior gradient */}
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none" />
        
        <div className="p-6 font-extrabold text-2xl border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 relative flex items-center justify-center shrink-0">
              <Image
                src="/logo-hr.png"
                alt="MEP HR Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain filter drop-shadow-md"
                priority
              />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight">
              {appName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          {renderNavItem('/', LayoutDashboard, 'Dashboard', 'text-slate-300', true)}
          
          {(hasModule('WORKERS') || hasModule('CONFIRMATIONS') || hasModule('IDCARD')) && (
            renderNavItem(employeesHref, Users, 'Employees')
          )}
          {hasModule('COMPANIES') && renderNavItem('/companies', Building2, 'Companies')}
          {hasModule('ATTENDANCE') && renderNavItem('/attendance', CalendarCheck, 'Attendance')}
          {(hasModule('PAYROLL') || hasModule('SETTLEMENTS')) && (
            <div className="space-y-1">
              <div
                className={`group flex items-center justify-between rounded-xl transition-all duration-300 font-medium ${
                  isPayrollExactActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/25 translate-x-1 font-semibold'
                    : 'hover:bg-white/10 text-slate-300 hover:text-white hover:translate-x-1'
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
                      onClose?.();
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 flex-1 min-w-0"
                >
                  <Banknote size={18} className={isPayrollExactActive ? 'text-white' : 'opacity-75'} />
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
                  <div className="pl-4 space-y-1 border-l border-white/15 ml-5 py-1">
                    {renderNavItem('/payroll/settlements', CreditCard, 'Settlements', 'text-slate-400', false, isPayrollOpen ? 0 : -1)}
                    {renderNavItem('/payroll/salary-statement', FileSpreadsheet, 'Salary Statement', 'text-slate-400', false, isPayrollOpen ? 0 : -1)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {hasModule('TRAINING') && renderNavItem('/training', GraduationCap, 'Training')}
          {hasModule('RECRUITMENT') && (
            <div className="space-y-1">
              <div
                className={`group flex items-center justify-between rounded-xl transition-all duration-300 font-medium ${
                  isRecruitmentParentActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/25 translate-x-1 font-semibold'
                    : 'hover:bg-white/10 text-slate-300 hover:text-white hover:translate-x-1'
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
                      onClose?.();
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 flex-1 min-w-0"
                >
                  <Briefcase size={18} className={isRecruitmentParentActive ? 'text-white' : 'opacity-75'} />
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
                  <div className="pl-4 space-y-1 border-l border-white/15 ml-5 py-1">
                    {renderNavItem('/recruitment/manpower', Sliders, 'Manpower Entry', 'text-slate-400', false, isRecruitmentOpen ? 0 : -1)}
                    {renderNavItem('/recruitment?tab=jobs', Briefcase, 'Job Circulars', 'text-slate-400', false, isRecruitmentOpen ? 0 : -1)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {hasModule('TASKS') && renderNavItem('/tasks', CheckSquare, 'Tasks')}
          
          <div className="pt-5 mt-5 border-t border-white/10 space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-4 mb-2">Admin</div>
            {user?.role === 'SUPER_ADMIN' && (
              <>
                {renderNavItem('/users', Shield, 'User Management', 'text-blue-300')}
                {renderNavItem('/activity-logs', Activity, 'Activity Logs', 'text-emerald-300')}
              </>
            )}
            {renderNavItem('/settings', Settings, 'Settings', 'text-slate-300')}
          </div>
        </nav>
      </aside>
    </>
  );
}
