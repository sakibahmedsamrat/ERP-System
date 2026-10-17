import prisma from '@/lib/prisma';
import SettlementManagerClient from './SettlementManagerClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettlementsPage() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  const hasModule = (modName: string) => {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  if (!hasModule('PAYROLL') && !hasModule('SETTLEMENTS')) {
    redirect('/');
  }
  const settlements = await prisma.settlement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          workerId: true,
          designation: true,
          department: { select: { name: true } },
          company: { select: { name: true } },
          isDeleted: true,
          deletedAt: true,
        }
      }
    }
  });

  return <SettlementManagerClient initialSettlements={settlements as any} />;
}
