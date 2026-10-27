'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { logAction } from '@/lib/audit';

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

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { workerId: true, name: true },
    });

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

    const label = type === '6m' ? '6 Months' : '3 Years';
    await logAction(
      'CONFIRMATIONS',
      'CONFIRM',
      `Confirmed ${label} status for ${worker?.name || workerId} (${worker?.workerId || workerId})${remarks ? ` - Note: ${remarks}` : ''}`
    );

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

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { workerId: true, name: true },
    });

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

    const label = type === '6m' ? '6 Months' : '3 Years';
    await logAction(
      'CONFIRMATIONS',
      'UNDO',
      `Reverted ${label} confirmation for ${worker?.name || workerId} (${worker?.workerId || workerId})`
    );

    revalidatePath('/confirmations');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to undo confirmation:', err);
    return { success: false, error: err.message || 'Failed to undo confirmation' };
  }
}

export async function bulkMarkConfirmationDone(
  workerIds: string[],
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

    if (!workerIds || workerIds.length === 0) {
      return { success: false, error: 'No employees selected for confirmation' };
    }

    const workers = await prisma.worker.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, workerId: true, name: true },
    });

    const updateData: any = {};
    const now = new Date();
    if (type === '6m') {
      updateData.confirmed6mAt = now;
      if (remarks !== undefined && remarks.trim() !== '') {
        updateData.confirmed6mRemarks = remarks.trim();
      }
    } else if (type === '3y') {
      updateData.confirmed3yAt = now;
      if (remarks !== undefined && remarks.trim() !== '') {
        updateData.confirmed3yRemarks = remarks.trim();
      }
    } else {
      return { success: false, error: 'Invalid confirmation type' };
    }

    const result = await prisma.worker.updateMany({
      where: { id: { in: workerIds } },
      data: updateData,
    });

    const label = type === '6m' ? '6 Months' : '3 Years';
    const sampleNames = workers.slice(0, 3).map((w) => `${w.name} (${w.workerId})`).join(', ');
    const moreCount = workers.length > 3 ? ` and ${workers.length - 3} more` : '';
    const logDetails = `Bulk confirmed ${result.count} employee(s) for ${label} status: ${sampleNames}${moreCount}${remarks ? ` [Remarks: ${remarks.trim()}]` : ''}`;

    await logAction('CONFIRMATIONS', 'BULK_CONFIRM', logDetails);

    revalidatePath('/confirmations');
    return { success: true, count: result.count };
  } catch (err: any) {
    console.error('Failed to bulk mark confirmation:', err);
    return { success: false, error: err.message || 'Failed to bulk confirm employees' };
  }
}

export async function bulkUndoConfirmation(
  workerIds: string[],
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

    if (!workerIds || workerIds.length === 0) {
      return { success: false, error: 'No employees selected to revert' };
    }

    const workers = await prisma.worker.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, workerId: true, name: true },
    });

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

    const result = await prisma.worker.updateMany({
      where: { id: { in: workerIds } },
      data: updateData,
    });

    const label = type === '6m' ? '6 Months' : '3 Years';
    const sampleNames = workers.slice(0, 3).map((w) => `${w.name} (${w.workerId})`).join(', ');
    const moreCount = workers.length > 3 ? ` and ${workers.length - 3} more` : '';
    const logDetails = `Bulk reverted ${result.count} employee(s) for ${label} confirmation: ${sampleNames}${moreCount}`;

    await logAction('CONFIRMATIONS', 'BULK_UNDO', logDetails);

    revalidatePath('/confirmations');
    return { success: true, count: result.count };
  } catch (err: any) {
    console.error('Failed to bulk revert confirmation:', err);
    return { success: false, error: err.message || 'Failed to revert selected employees' };
  }
}
