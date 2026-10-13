import prisma from '@/lib/prisma';
import SettlementManagerClient from './SettlementManagerClient';

export const dynamic = 'force-dynamic';

export default async function SettlementsPage() {
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
        }
      }
    }
  });

  return <SettlementManagerClient initialSettlements={settlements as any} />;
}
