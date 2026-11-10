import prisma, { withDbTimeout } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import KpiDashboardClient from './KpiDashboardClient';

export const dynamic = 'force-dynamic';

export default async function KpiPage() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect('/kpi/login');
  }

  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  const isSupervisor = user.role === 'KPI_SUPERVISOR';
  const isWorker = user.role === 'KPI_WORKER';

  let currentWorker: any = null;
  let workers: any[] = [];
  let subordinates: any[] = [];
  let targets: any[] = [];
  let departments: any[] = [];

  if (isAdmin) {
    // Admin View: Fetch full enterprise dataset
    [workers, targets, departments] = await Promise.all([
      withDbTimeout(
        prisma.worker.findMany({
          where: { isDeleted: false, isActive: true },
          select: {
            id: true,
            workerId: true,
            name: true,
            designation: true,
            department: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            company: { select: { id: true, name: true } },
            supervisorId: true,
            supervisor: { select: { id: true, workerId: true, name: true, designation: true } },
            kpiAccount: { select: { id: true, isSupervisor: true, lastLogin: true } },
          },
          orderBy: { workerId: 'asc' },
        }),
        5000,
        []
      ),
      withDbTimeout(
        prisma.kpiTarget.findMany({
          include: {
            worker: {
              select: {
                id: true,
                workerId: true,
                name: true,
                designation: true,
                department: { select: { name: true } },
                section: { select: { name: true } },
              },
            },
            supervisor: {
              select: {
                id: true,
                workerId: true,
                name: true,
                designation: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        5000,
        []
      ),
      withDbTimeout(
        prisma.department.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        5000,
        []
      ),
    ]);
  } else if (isSupervisor) {
    // Supervisor View: Fetch supervisor profile, subordinates, and related targets
    [currentWorker, subordinates] = await Promise.all([
      withDbTimeout(
        prisma.worker.findUnique({
          where: { id: user.id },
          include: {
            department: { select: { name: true } },
            section: { select: { name: true } },
            supervisor: { select: { id: true, workerId: true, name: true, designation: true } },
          },
        }),
        5000,
        null
      ),
      withDbTimeout(
        prisma.worker.findMany({
          where: { supervisorId: user.id, isDeleted: false, isActive: true },
          select: {
            id: true,
            workerId: true,
            name: true,
            designation: true,
            department: { select: { name: true } },
            section: { select: { name: true } },
          },
          orderBy: { workerId: 'asc' },
        }),
        5000,
        []
      ),
    ]);

    const subordinateIds = subordinates.map((s) => s.id);

    targets = await withDbTimeout(
      prisma.kpiTarget.findMany({
        where: {
          OR: [
            { workerId: user.id },
            { supervisorId: user.id },
            { workerId: { in: subordinateIds } },
          ],
        },
        include: {
          worker: {
            select: {
              id: true,
              workerId: true,
              name: true,
              designation: true,
              department: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
          supervisor: {
            select: {
              id: true,
              workerId: true,
              name: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      5000,
      []
    );
  } else {
    // Worker View: Fetch employee profile and their assigned targets
    currentWorker = await withDbTimeout(
      prisma.worker.findUnique({
        where: { id: user.id },
        include: {
          department: { select: { name: true } },
          section: { select: { name: true } },
          supervisor: { select: { id: true, workerId: true, name: true, designation: true, phone: true } },
        },
      }),
      5000,
      null
    );

    targets = await withDbTimeout(
      prisma.kpiTarget.findMany({
        where: { workerId: user.id },
        include: {
          supervisor: {
            select: {
              id: true,
              workerId: true,
              name: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      5000,
      []
    );
  }

  return (
    <KpiDashboardClient
      user={user}
      currentWorker={currentWorker}
      initialWorkers={workers}
      initialSubordinates={subordinates}
      initialTargets={targets}
      departments={departments}
    />
  );
}
