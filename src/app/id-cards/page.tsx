import IdCardsClient from '@/components/id-cards/IdCardsClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'ID Card Generator | HR ERP',
};

export default async function IdCardsPage({
  searchParams
}: {
  searchParams?: { tab?: string; [key: string]: string | undefined };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const role = session?.user?.role;
  const userModules = (session?.user?.modules || '').split(',').map((m: string) => m.trim());
  const hasAccess = role === 'SUPER_ADMIN' || session?.user?.modules === '*' || userModules.includes('IDCARD');

  if (!hasAccess) {
    redirect('/');
  }

  const canAccessWorkers = role === 'SUPER_ADMIN' || session?.user?.modules === '*' || userModules.includes('WORKERS');
  const initialTab = searchParams?.tab === 'visitor' ? 'visitor' : 'employee';

  return <IdCardsClient initialTab={initialTab} searchParams={searchParams} canAccessWorkers={canAccessWorkers} />;
}
