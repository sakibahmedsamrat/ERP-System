import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RecycleBinClient from './RecycleBinClient';

export const metadata = {
  title: 'Employee Recycle Bin | HR ERP',
};

export const dynamic = 'force-dynamic';

export default async function RecycleBinPage() {
  const session = await getSession();
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/workers');
  }

  const deletedWorkers = await prisma.worker.findMany({
    where: {
      isDeleted: true,
    },
    select: {
      id: true,
      workerId: true,
      name: true,
      designation: true,
      phone: true,
      deletedAt: true,
      company: {
        select: { id: true, name: true },
      },
      department: {
        select: { id: true, name: true },
      },
      section: {
        select: { id: true, name: true },
      },
      settlements: {
        select: {
          id: true,
          status: true,
          lastWorkingDay: true,
          resignApplyDate: true,
          totalPayAmount: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: {
      deletedAt: 'desc',
    },
  });

  return <RecycleBinClient initialWorkers={deletedWorkers} />;
}
