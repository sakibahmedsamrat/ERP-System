'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {
    // Ignore
  }
}

export async function checkInVisitor(formData: FormData) {
  const visitorName = formData.get('visitorName') as string;
  const visitorPhone = formData.get('visitorPhone') as string;
  const visitorCompany = (formData.get('visitorCompany') as string) || null;
  const visitorNid = (formData.get('visitorNid') as string) || null;
  const hostWorkerId = (formData.get('hostWorkerId') as string) || null;
  const hostName = (formData.get('hostName') as string) || null;
  const purpose = formData.get('purpose') as string;
  const belongings = (formData.get('belongings') as string) || null;
  const expectedDuration = parseInt((formData.get('expectedDuration') as string) || '60', 10);

  if (!visitorName || !visitorPhone || !purpose) {
    return { success: false, error: 'Visitor Name, Phone Number, and Purpose are required.' };
  }

  // Generate unique pass number safely without infinite loop risk
  let passNumber = '';
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 50) {
    attempts++;
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    passNumber = `VIS-${randomDigits}`;
    const found = await prisma.visitorLog.findUnique({
      where: { passNumber }
    });
    if (!found) exists = false;
  }
  if (exists) {
    passNumber = `VIS-${Date.now().toString().slice(-6)}`;
  }

  try {
    const visitor = await prisma.visitorLog.create({
      data: {
        passNumber,
        visitorName,
        visitorPhone,
        visitorCompany,
        visitorNid,
        hostWorkerId: hostWorkerId && hostWorkerId.trim() !== '' ? hostWorkerId : null,
        hostName,
        purpose,
        belongings,
        expectedDuration: isNaN(expectedDuration) ? 60 : expectedDuration,
        status: 'IN_PREMISES',
      }
    });

    safeRevalidate('/id-cards');
    return { success: true, visitor };
  } catch (err: any) {
    console.error('Visitor check-in error:', err);
    return { success: false, error: err.message || 'Failed to check in visitor.' };
  }
}

export async function checkOutVisitor(id: string) {
  try {
    await prisma.visitorLog.update({
      where: { id },
      data: {
        status: 'CHECKED_OUT',
        checkOutTime: new Date()
      }
    });

    safeRevalidate('/id-cards');
    return { success: true };
  } catch (err: any) {
    console.error('Visitor checkout error:', err);
    return { success: false, error: err.message || 'Failed to check out visitor.' };
  }
}

export async function deleteVisitorLog(id: string) {
  try {
    await prisma.visitorLog.delete({
      where: { id }
    });

    safeRevalidate('/id-cards');
    return { success: true };
  } catch (err: any) {
    console.error('Delete visitor log error:', err);
    return { success: false, error: err.message || 'Failed to delete visitor record.' };
  }
}
