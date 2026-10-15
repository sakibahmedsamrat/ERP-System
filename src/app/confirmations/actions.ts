'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function markConfirmationDone(
  workerId: string,
  type: '6m' | '3y',
  remarks?: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const role = session.user?.role;
    const userModules = (session.user?.modules || '').split(',').map((m: string) => m.trim());
    const hasAccess = role === 'SUPER_ADMIN' || session.user?.modules === '*' || userModules.includes('CONFIRMATIONS');
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized: Missing CONFIRMATIONS permission' };
    }

    const updateData: any = {};
    if (type === '6m') {
      updateData.confirmed6mAt = new Date();
      if (remarks !== undefined) updateData.confirmed6mRemarks = remarks;
    } else if (type === '3y') {
      updateData.confirmed3yAt = new Date();
      if (remarks !== undefined) updateData.confirmed3yRemarks = remarks;
    } else {
      return { success: false, error: 'Invalid confirmation type' };
    }

    await prisma.worker.update({
      where: { id: workerId },
      data: updateData,
    });

    revalidatePath('/confirmations');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to mark confirmation:', err);
    return { success: false, error: err.message || 'Failed to update confirmation' };
  }
}

export async function undoConfirmation(
  workerId: string,
  type: '6m' | '3y'
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const role = session.user?.role;
    const userModules = (session.user?.modules || '').split(',').map((m: string) => m.trim());
    const hasAccess = role === 'SUPER_ADMIN' || session.user?.modules === '*' || userModules.includes('CONFIRMATIONS');
    if (!hasAccess) {
      return { success: false, error: 'Unauthorized: Missing CONFIRMATIONS permission' };
    }

    const updateData: any = {};
    if (type === '6m') {
      updateData.confirmed6mAt = null;
      updateData.confirmed6mRemarks = null;
    } else if (type === '3y') {
      updateData.confirmed3yAt = null;
      updateData.confirmed3yRemarks = null;
    } else {
      return { success: false, error: 'Invalid confirmation type' };
    }

    await prisma.worker.update({
      where: { id: workerId },
      data: updateData,
    });

    revalidatePath('/confirmations');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to undo confirmation:', err);
    return { success: false, error: err.message || 'Failed to undo confirmation' };
  }
}
