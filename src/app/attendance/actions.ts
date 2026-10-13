'use server'


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
  
  // Get all keys from formData that start with "status_"
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

  // Use a transaction to delete existing attendance for these workers on this date and insert new
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
    console.error("Failed to mark attendance", error);
    return;
  }

  revalidatePath('/attendance');
  redirect(`/attendance?date=${encodeURIComponent(dateStr)}`);
}
