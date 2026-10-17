'use client'

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith('/login');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Automatically close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <main className="flex-1 bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FE] print:bg-white print:h-auto print:overflow-visible font-sans text-gray-800 selection:bg-blue-100">
      <Suspense fallback={<aside className="w-72 bg-[#0F172A] text-white h-screen shrink-0 hidden lg:block" />}>
        <Sidebar 
          user={user} 
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </Suspense>
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden print:h-auto print:overflow-visible">
        <Header 
          user={user} 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="py-3 px-4 sm:px-8 text-right text-xs text-gray-400 print:hidden select-none leading-relaxed">
            <div>Created by <span className="text-gray-500 font-medium">Sakib Ahmed Samrat</span> (Executive-HR)</div>
            <div>Copyright by HR Team(MEP Group) 2026.</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
