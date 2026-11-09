import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SalaryStatementClient from './SalaryStatementClient';
import ModuleLoading from '@/components/ModuleLoading';

export const metadata = {
  title: 'Salary Statement & Certificate | Payroll | HR ERP',
};

export const dynamic = 'force-dynamic';

export default async function SalaryStatementPage({
  searchParams,
}: {
  searchParams?: { id?: string | string[] };
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

  return (
    <Suspense fallback={<ModuleLoading title="Salary Statement Generator" />}>
      <SalaryStatementClient initialStatementId={initialStatementId} />
    </Suspense>
  );
}
