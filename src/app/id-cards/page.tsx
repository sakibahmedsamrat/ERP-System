import IdCardsClient from '@/components/id-cards/IdCardsClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'ID Card Generator & Visitor Management | HR ERP',
};

export const dynamic = 'force-dynamic';

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
  
  let initialTab: 'employee' | 'visitor' | 'batch' = 'employee';
  if (searchParams?.tab === 'visitor') initialTab = 'visitor';
  if (searchParams?.tab === 'batch') initialTab = 'batch';

  const isBatchTab = initialTab === 'batch';

  // Load workers for batch print & visitor host selection (exclude heavy photoUrl blobs on default view)
  const [workersRaw, visitorLogsRaw, companiesRaw] = await Promise.all([
    prisma.worker.findMany({
      where: { isDeleted: false, isActive: true },
      select: {
        id: true,
        workerId: true,
        name: true,
        designation: true,
        bloodGroup: true,
        phone: true,
        photoUrl: isBatchTab,
        joinDate: true,
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    }),

    prisma.visitorLog.findMany({
      orderBy: { checkInTime: 'desc' },
      take: 100,
      include: {
        hostWorker: {
          select: {
            id: true,
            workerId: true,
            name: true,
            department: { select: { name: true } }
          }
        }
      }
    }),

    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  const workers = workersRaw.map(w => ({
    ...w,
    joinDate: w.joinDate.toISOString()
  }));

  const visitorLogs = visitorLogsRaw.map(v => ({
    ...v,
    checkInTime: v.checkInTime.toISOString(),
    checkOutTime: v.checkOutTime ? v.checkOutTime.toISOString() : null,
  }));

  return (
    <IdCardsClient 
      initialTab={initialTab} 
      searchParams={searchParams} 
      canAccessWorkers={canAccessWorkers}
      workers={workers}
      visitorLogs={visitorLogs}
      companies={companiesRaw}
    />
  );
}
