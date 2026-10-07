'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function markAttendance(formData: FormData) {
  const dateStr = formData.get('date') as string;
  const companyId = formData.get('companyId') as string;
  
  if (!dateStr || !companyId) {
    return { error: 'Date and Company are required' };
  }

  const date = new Date(dateStr);
  
  // Get all keys from formData that start with "status_"
  const records = [];
  for (const [key, value] of formData.entries()) {
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
    
    // We want to delete existing records for the same day (ignoring time)
    // For simplicity, we just delete exactly matching dates or use a date range in a real app.
    // Assuming date from input is Midnight UTC, we can delete matching dates.
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

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
      // SQLite doesn't support createMany, so we use Promise.all
      ...records.map(record => prisma.attendance.create({
        data: {
          workerId: record.workerId,
          date: record.date,
          status: record.status,
        }
      }))
    ]);
  } catch (error) {
    console.error("Failed to mark attendance", error);
    return { error: 'Failed to save attendance' };
  }

  revalidatePath('/attendance');
  redirect('/attendance');
}
