'use client'

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith('/login');

  if (isLoginPage) {
    return <main className="flex-1 bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FE] print:bg-white font-sans text-gray-800 selection:bg-blue-100">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="py-3 px-8 text-right text-xs text-gray-400 print:hidden select-none leading-relaxed">
            <div>Created by <span className="text-gray-500 font-medium">Sakib Ahmed Samrat</span> (Executive-HR)</div>
            <div>Copyright by HR Team(MEP Group) 2026.</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
