'use client'

import { usePathname } from 'next/navigation';
import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { logoutAction } from '@/app/logout/actions';
import NotificationBell from './NotificationBell';

export default function Header({ user }: { user?: any }) {
  const pathname = usePathname();
  
  // Format the current path nicely
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const path = pathname.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-10 print:hidden">
      <div className="flex justify-between items-center px-8 py-4">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">{getPageTitle()}</h1>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full text-sm outline-none transition-all w-64"
            />
          </div>
          
          <NotificationBell />
          
          <div className="h-6 w-px bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">{user?.name || 'User'}</span>
              <span className="text-xs text-blue-600 font-medium">{user?.role || 'Guest'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <UserCircle size={24} />
            </div>
            <form action={logoutAction} className="ml-2">
              <button title="Logout" type="submit" className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}

