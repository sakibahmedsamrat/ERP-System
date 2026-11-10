'use server'

import { logout, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  let isKpi = false;
  try {
    const session = await getSession();
    const role = session?.user?.role;
    isKpi = role === 'KPI_WORKER' || role === 'KPI_SUPERVISOR';
  } catch (err) {
    console.error('Logout session check error:', err);
  }

  await logout();
  redirect(isKpi ? '/kpi/login' : '/login');
}

