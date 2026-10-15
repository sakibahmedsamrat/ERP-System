import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SalaryStatementClient from './SalaryStatementClient';

export const metadata = {
  title: 'Salary Statement & Certificate | Payroll | HR ERP',
};

export const dynamic = 'force-dynamic';

export default async function SalaryStatementPage() {
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

  return <SalaryStatementClient />;
}
