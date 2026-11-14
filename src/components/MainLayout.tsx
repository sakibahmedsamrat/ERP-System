'use client'

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith('/login') || pathname.startsWith('/kpi/login');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  // Keep state in sync with server user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Synchronize avatar updates in real time across the entire layout
  const currentUserId = currentUser?.id;
  const currentLoginId = currentUser?.userId;
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ profileImage?: string | null; userId?: string }>;
      if (customEvent.detail) {
        const { profileImage, userId } = customEvent.detail;
        if (!userId || !currentUserId || userId === currentUserId || userId === currentLoginId) {
          setCurrentUser((prev: any) => (prev ? { ...prev, profileImage: profileImage || null } : prev));
        }
      }
    };

    window.addEventListener('erp-avatar-updated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('erp-avatar-updated', handleAvatarUpdate);
    };
  }, [currentUserId, currentLoginId]);

  // Automatically close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <div className="ambient-mesh relative flex h-screen h-[100dvh] overflow-hidden print:bg-white print:h-auto print:overflow-visible font-sans text-slate-800 selection:bg-blue-500/20">
      <Suspense fallback={<aside className="w-72 bg-slate-900/95 text-white h-screen h-[100dvh] shrink-0 hidden lg:block" />}>
        <Sidebar 
          user={currentUser} 
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </Suspense>

      <div className="flex-1 flex flex-col h-screen h-[100dvh] min-w-0 overflow-hidden print:h-auto print:overflow-visible relative z-10">
        <Header 
          user={currentUser} 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="py-3 px-3 sm:px-8 text-center sm:text-right text-xs text-slate-400 print:hidden select-none leading-relaxed border-t border-white/40 bg-white/30 backdrop-blur-sm safe-pb">
            <div>Created by <span className="text-slate-600 font-medium">Sakib Ahmed Samrat</span> (Executive-HR)</div>
            <div>Copyright by HR Team(MEP Group) 2026.</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
