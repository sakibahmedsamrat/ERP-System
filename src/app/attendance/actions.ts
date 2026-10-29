'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function markAttendance(formData: FormData): Promise<void> {
  const dateStr = formData.get('date') as string;
  const companyId = formData.get('companyId') as string;

  if (!dateStr || !companyId) {
    return;
  }

  const date = new Date(dateStr);

  const records: { workerId: string; date: Date; status: string }[] = [];
  const entries = Array.from(formData.entries());
  for (const [key, value] of entries) {
    if (key.startsWith('status_')) {
      const workerId = key.replace('status_', '');
      records.push({
        workerId,
        date: date,
        status: value as string,
      });
    }
  }

  try {
    const workerIds = records.map(r => r.workerId);

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    if (records.length > 0) {
      await prisma.$transaction([
        prisma.attendance.deleteMany({
          where: {
            workerId: { in: workerIds },
            date: {
              gte: startOfDay,
              lte: endOfDay,
            }
          }
        }),
        prisma.attendance.createMany({
          data: records
        })
      ]);
    }
  } catch (error) {
    console.error('Failed to mark attendance', error);
    return;
  }

  revalidatePath('/attendance');
  redirect(`/attendance?date=${encodeURIComponent(dateStr)}`);
}

export async function applyLeaveRequest(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const leaveType = formData.get('leaveType') as string || 'CASUAL';
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const reason = formData.get('reason') as string || null;

  if (!workerId || !startDateStr || !endDateStr) {
    return { success: false, error: 'Worker, start date, and end date are required.' };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
    return { success: false, error: 'Invalid start date or end date.' };
  }

  // Calculate day difference (inclusive)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  try {
    await prisma.leaveRequest.create({
      data: {
        workerId,
        leaveType,
        startDate,
        endDate,
        days,
        reason,
        status: 'PENDING',
      }
    });

    revalidatePath('/attendance');
    return { success: true };
  } catch (err: any) {
    console.error('Error applying for leave:', err);
    return { success: false, error: err.message || 'Failed to submit leave request.' };
  }
}

export async function updateLeaveStatus(
  leaveId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string,
  approvedBy?: string
) {
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { worker: true }
    });

    if (!leave) {
      return { success: false, error: 'Leave request not found.' };
    }

    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason || 'Rejected by management' : null,
        approvedBy: status === 'APPROVED' ? (approvedBy || 'HR Admin') : null,
      }
    });

    // If APPROVED, automatically sync attendance records with 'LEAVE'
    if (status === 'APPROVED') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dayStart = new Date(currentDate);
        dayStart.setUTCHours(0, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setUTCHours(23, 59, 59, 999);

        // Delete any existing attendance record for this worker on this day
        await prisma.attendance.deleteMany({
          where: {
            workerId: leave.workerId,
            date: {
              gte: dayStart,
              lte: dayEnd,
            }
          }
        });

        // Create new LEAVE record
        await prisma.attendance.create({
          data: {
            workerId: leave.workerId,
            date: new Date(dayStart),
            status: 'LEAVE',
          }
        });

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    }

    revalidatePath('/attendance');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating leave status:', err);
    return { success: false, error: err.message || 'Failed to update leave status.' };
  }
}

export async function addHoliday(formData: FormData) {
  const title = formData.get('title') as string;
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const type = (formData.get('type') as string) || 'PUBLIC';
  const companyId = (formData.get('companyId') as string) || null;
  const description = (formData.get('description') as string) || null;

  if (!title || !startDateStr || !endDateStr) {
    return { success: false, error: 'Title, start date, and end date are required.' };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
    return { success: false, error: 'Invalid start or end date.' };
  }

  try {
    await prisma.holiday.create({
      data: {
        title,
        startDate,
        endDate,
        type,
        companyId: companyId && companyId.trim() !== '' ? companyId : null,
        description,
      }
    });

    revalidatePath('/attendance');
    return { success: true };
  } catch (err: any) {
    console.error('Error creating holiday:', err);
    return { success: false, error: err.message || 'Failed to create holiday.' };
  }
}

export async function deleteHoliday(id: string) {
  try {
    await prisma.holiday.delete({
      where: { id }
    });

    revalidatePath('/attendance');
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting holiday:', err);
    return { success: false, error: err.message || 'Failed to delete holiday.' };
  }
}
