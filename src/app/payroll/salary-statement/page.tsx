import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma, { withDbTimeout } from '@/lib/prisma';
import SalaryStatementClient from './SalaryStatementClient';
import ModuleLoading from '@/components/ModuleLoading';

export const metadata = {
  title: 'Salary Statement & Certificate | Payroll | HR ERP',
};

export const dynamic = 'force-dynamic';

export default async function SalaryStatementPage({
  searchParams,
}: {
  searchParams?: { id?: string | string[]; new?: string };
}) {
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    session = null;
  }

  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  const hasModule = (modName: string) => {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim().toUpperCase());
    return mods.includes(modName.toUpperCase());
  };

  if (!hasModule('PAYROLL') && !hasModule('SETTLEMENTS')) {
    redirect('/');
  }

  const rawId = searchParams?.id;
  const initialStatementId = Array.isArray(rawId) ? rawId[0] : rawId;
  const isExplicitNew = searchParams?.new === 'true' || searchParams?.new === '1';

  let initialStatements: any[] = [];
  try {
    initialStatements = await withDbTimeout(
      prisma.salaryStatement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          refNo: true,
          workerId: true,
          workerDbId: true,
          name: true,
          designation: true,
          department: true,
          statementDate: true,
          createdAt: true,
          updatedAt: true,
          data: true,
          worker: {
            select: {
              id: true,
              name: true,
              workerId: true,
              designation: true,
              department: { select: { name: true } },
              company: { select: { name: true } },
            },
          },
        },
      }),
      3000,
      []
    );
  } catch (error) {
    console.error('Error fetching initial salary statements:', error);
    initialStatements = [];
  }

  return (
    <Suspense fallback={<ModuleLoading title="Salary Statement Generator" />}>
      <SalaryStatementClient
        initialStatementId={initialStatementId}
        initialStatements={initialStatements as any}
        isExplicitNew={isExplicitNew}
      />
    </Suspense>
  );
}
