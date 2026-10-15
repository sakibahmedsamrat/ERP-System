import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ConfirmationsClient from './ConfirmationsClient';

export const metadata = {
  title: 'Employee Confirmation | HR ERP',
};

export default async function ConfirmationsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const role = session?.user?.role;
  const userModules = (session?.user?.modules || '').split(',').map((m: string) => m.trim());
  const hasAccess = role === 'SUPER_ADMIN' || session?.user?.modules === '*' || userModules.includes('CONFIRMATIONS');

  if (!hasAccess) {
    redirect('/');
  }

  // Fetch all active workers with only required fields (excluding heavy base64 images)
  const workers = await prisma.worker.findMany({
    where: {
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      workerId: true,
      name: true,
      designation: true,
      gender: true,
      bloodGroup: true,
      phone: true,
      grade: true,
      grossSalary: true,
      joinDate: true,
      confirmed6mAt: true,
      confirmed3yAt: true,
      confirmed6mRemarks: true,
      confirmed3yRemarks: true,
      company: {
        select: { id: true, name: true },
      },
      department: {
        select: { id: true, name: true },
      },
      section: {
        select: { id: true, name: true },
      },
      subSection: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      joinDate: 'asc',
    },
  });

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Serialize dates to ISO strings for client component safely
  const serializedWorkers = workers.map((w) => ({
    ...w,
    photoUrl: null,
    joinDate: w.joinDate ? w.joinDate.toISOString() : null,
    confirmed6mAt: w.confirmed6mAt ? w.confirmed6mAt.toISOString() : null,
    confirmed3yAt: w.confirmed3yAt ? w.confirmed3yAt.toISOString() : null,
  }));

  const canAccessWorkers = role === 'SUPER_ADMIN' || session?.user?.modules === '*' || userModules.includes('WORKERS');

  return (
    <ConfirmationsClient
      initialWorkers={serializedWorkers}
      companies={companies}
      departments={departments}
      userRole={role}
      canAccessWorkers={canAccessWorkers}
    />
  );
}
