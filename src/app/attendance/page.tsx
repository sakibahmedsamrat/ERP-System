import prisma from '@/lib/prisma';
import AttendanceClient from './AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({ searchParams }: { searchParams: { date?: string } }) {
  const rawDate = searchParams?.date;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const dateStr = safeDate.toISOString().split('T')[0];

  const startOfDay = new Date(safeDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(safeDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Fetch concurrent data
  const [attendancesRaw, leaveRequestsRaw, holidaysRaw, workersRaw, companies] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        worker: {
          isDeleted: false,
        }
      },
      include: {
        worker: {
          select: {
            id: true,
            workerId: true,
            name: true,
            company: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),

    prisma.leaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        worker: {
          select: {
            id: true,
            workerId: true,
            name: true,
            company: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } }
          }
        }
      }
    }),

    prisma.holiday.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        company: { select: { id: true, name: true } }
      }
    }),

    prisma.worker.findMany({
      where: { isDeleted: false, isActive: true },
      select: {
        id: true,
        workerId: true,
        name: true,
        company: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    }),

    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  // Serializable attendances
  const attendances = attendancesRaw.map((a) => ({
    id: a.id,
    status: a.status,
    date: a.date.toISOString(),
    worker: a.worker
  }));

  // Serializable leave requests
  const leaveRequests = leaveRequestsRaw.map((l) => ({
    id: l.id,
    workerId: l.workerId,
    leaveType: l.leaveType,
    startDate: l.startDate.toISOString(),
    endDate: l.endDate.toISOString(),
    days: l.days,
    reason: l.reason,
    status: l.status,
    rejectionReason: l.rejectionReason,
    approvedBy: l.approvedBy,
    createdAt: l.createdAt.toISOString(),
    worker: l.worker
  }));

  // Serializable holidays
  const holidays = holidaysRaw.map((h) => ({
    id: h.id,
    title: h.title,
    startDate: h.startDate.toISOString(),
    endDate: h.endDate.toISOString(),
    type: h.type,
    companyId: h.companyId,
    company: h.company,
    description: h.description,
  }));

  // High-performance Statutory Ledger Calculations via O(1) Map lookup
  const leavesByWorker = new Map<string, { casual: number; sick: number; earned: number }>();
  for (const l of leaveRequestsRaw) {
    if (l.status === 'APPROVED') {
      let entry = leavesByWorker.get(l.workerId);
      if (!entry) {
        entry = { casual: 0, sick: 0, earned: 0 };
        leavesByWorker.set(l.workerId, entry);
      }
      if (l.leaveType === 'CASUAL') entry.casual += l.days;
      else if (l.leaveType === 'SICK') entry.sick += l.days;
      else if (l.leaveType === 'EARNED') entry.earned += l.days;
    }
  }

  const statutoryLedger = workersRaw.map((w) => {
    const entry = leavesByWorker.get(w.id);
    return {
      workerId: w.id,
      empId: w.workerId,
      name: w.name,
      companyName: w.company?.name || 'N/A',
      casualTaken: entry?.casual || 0,
      sickTaken: entry?.sick || 0,
      earnedTaken: entry?.earned || 0,
    };
  });

  return (
    <AttendanceClient
      initialDate={dateStr}
      attendances={attendances}
      leaveRequests={leaveRequests}
      holidays={holidays}
      workers={workersRaw}
      companies={companies}
      statutoryLedger={statutoryLedger}
    />
  );
}
