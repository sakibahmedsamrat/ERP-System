'use client'

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function MainLayout({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith('/login');

  if (isLoginPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 print:bg-white">
      <Sidebar user={user} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible">
        {children}
      </main>
    </div>
  );
}
