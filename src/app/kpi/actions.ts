'use server';

import prisma, { withDbTimeout } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to get authenticated user
async function getAuthContext() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error('Authentication required.');
  }
  return session.user;
}

/**
 * Assign or reassign supervisor to a worker
 */
export async function assignSupervisor(workerId: string, supervisorId: string | null) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    if (!isAdmin) {
      return { success: false, error: 'Only administrators can assign supervisors.' };
    }

    if (supervisorId && workerId === supervisorId) {
      return { success: false, error: 'An employee cannot be their own supervisor.' };
    }

    await withDbTimeout(
      prisma.worker.update({
        where: { id: workerId },
        data: { supervisorId: supervisorId || null },
      }),
      5000
    );

    // If supervisor was assigned, ensure supervisor's KPI account is flagged as supervisor
    if (supervisorId) {
      const supervisorAccount = await withDbTimeout(
        prisma.kpiAccount.findUnique({
          where: { workerId: supervisorId },
        }),
        5000,
        null
      );

      if (supervisorAccount && !supervisorAccount.isSupervisor) {
        await withDbTimeout(
          prisma.kpiAccount.update({
            where: { id: supervisorAccount.id },
            data: { isSupervisor: true },
          }),
          5000
        );
      }
    }

    revalidatePath('/kpi');
    return { success: true };
  } catch (error: any) {
    console.error('assignSupervisor error:', error);
    return { success: false, error: error?.message || 'Failed to assign supervisor.' };
  }
}

/**
 * Bulk assign supervisor to multiple workers
 */
export async function bulkAssignSupervisor(workerIds: string[], supervisorId: string | null) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    if (!isAdmin) {
      return { success: false, error: 'Only administrators can bulk assign supervisors.' };
    }

    if (!workerIds || workerIds.length === 0) {
      return { success: false, error: 'No workers selected.' };
    }

    // Filter out supervisor if selected among subordinates
    const filteredWorkerIds = workerIds.filter((id) => id !== supervisorId);

    await withDbTimeout(
      prisma.worker.updateMany({
        where: { id: { in: filteredWorkerIds } },
        data: { supervisorId: supervisorId || null },
      }),
      5000
    );

    if (supervisorId) {
      const supervisorAccount = await withDbTimeout(
        prisma.kpiAccount.findUnique({
          where: { workerId: supervisorId },
        }),
        5000,
        null
      );

      if (supervisorAccount && !supervisorAccount.isSupervisor) {
        await withDbTimeout(
          prisma.kpiAccount.update({
            where: { id: supervisorAccount.id },
            data: { isSupervisor: true },
          }),
          5000
        );
      }
    }

    revalidatePath('/kpi');
    return { success: true, count: filteredWorkerIds.length };
  } catch (error: any) {
    console.error('bulkAssignSupervisor error:', error);
    return { success: false, error: error?.message || 'Failed to bulk assign supervisors.' };
  }
}

/**
 * Create a new KPI target
 */
export async function createKpiTarget(data: {
  workerId: string;
  supervisorId?: string | null;
  period: string;
  title: string;
  description?: string;
  category?: string;
  targetValue?: number | null;
  unit?: string;
  weightage?: number;
  deadline?: string | null;
}) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isSupervisor = user.role === 'KPI_SUPERVISOR' || isAdmin;

    if (!isSupervisor && user.id !== data.workerId) {
      return { success: false, error: 'You do not have permission to set targets for this employee.' };
    }

    // If supervisor is creating target, set supervisorId to logged-in worker ID
    const effectiveSupervisorId = isAdmin
      ? (data.supervisorId || null)
      : (user.role === 'KPI_SUPERVISOR' ? user.id : data.supervisorId || null);

    const target = await withDbTimeout(
      prisma.kpiTarget.create({
        data: {
          workerId: data.workerId,
          supervisorId: effectiveSupervisorId,
          period: (data.period || '').trim() || 'Current Period',
          title: (data.title || '').trim(),
          description: data.description ? data.description.trim() : null,
          category: data.category || 'OPERATIONAL',
          targetValue: data.targetValue !== undefined && data.targetValue !== null ? Number(data.targetValue) : null,
          unit: data.unit ? data.unit.trim() : null,
          weightage: data.weightage ? Number(data.weightage) : 20,
          deadline: data.deadline ? new Date(data.deadline) : null,
          status: 'PENDING',
        },
      }),
      5000
    );

    revalidatePath('/kpi');
    return { success: true, target };
  } catch (error: any) {
    console.error('createKpiTarget error:', error);
    return { success: false, error: error?.message || 'Failed to create KPI target.' };
  }
}

/**
 * Update an existing KPI target
 */
export async function updateKpiTarget(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    targetValue?: number | null;
    unit?: string;
    weightage?: number;
    deadline?: string | null;
    status?: string;
  }
) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    const existing = await withDbTimeout(
      prisma.kpiTarget.findUnique({
        where: { id },
      }),
      5000,
      null
    );

    if (!existing) {
      return { success: false, error: 'KPI target not found.' };
    }

    const isSupervisor = isAdmin || existing.supervisorId === user.id;

    if (!isSupervisor && existing.workerId !== user.id) {
      return { success: false, error: 'Unauthorized to modify this KPI target.' };
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.targetValue !== undefined) updateData.targetValue = data.targetValue !== null ? Number(data.targetValue) : null;
    if (data.unit !== undefined) updateData.unit = data.unit?.trim() || null;
    if (data.weightage !== undefined) updateData.weightage = Number(data.weightage);
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.status !== undefined) updateData.status = data.status;

    const target = await withDbTimeout(
      prisma.kpiTarget.update({
        where: { id },
        data: updateData,
      }),
      5000
    );

    revalidatePath('/kpi');
    return { success: true, target };
  } catch (error: any) {
    console.error('updateKpiTarget error:', error);
    return { success: false, error: error?.message || 'Failed to update KPI target.' };
  }
}

/**
 * Delete a KPI target
 */
export async function deleteKpiTarget(id: string) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    const existing = await withDbTimeout(
      prisma.kpiTarget.findUnique({
        where: { id },
      }),
      5000,
      null
    );

    if (!existing) {
      return { success: false, error: 'KPI target not found.' };
    }

    const isAuthorized = isAdmin || existing.supervisorId === user.id;
    if (!isAuthorized) {
      return { success: false, error: 'Only the supervisor or administrator can delete KPI targets.' };
    }

    await withDbTimeout(
      prisma.kpiTarget.delete({
        where: { id },
      }),
      5000
    );

    revalidatePath('/kpi');
    return { success: true };
  } catch (error: any) {
    console.error('deleteKpiTarget error:', error);
    return { success: false, error: error?.message || 'Failed to delete KPI target.' };
  }
}

/**
 * Employee submits their actual progress, achievement value, and self-assessment
 */
export async function submitEmployeeAchievement(
  id: string,
  data: {
    actualValue?: number | null;
    progressPercent: number;
    employeeNotes?: string;
  }
) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    const existing = await withDbTimeout(
      prisma.kpiTarget.findUnique({
        where: { id },
      }),
      5000,
      null
    );

    if (!existing) {
      return { success: false, error: 'KPI target not found.' };
    }

    if (!isAdmin && existing.workerId !== user.id) {
      return { success: false, error: 'You can only submit self-assessment for your own assigned targets.' };
    }

    const progress = Math.min(100, Math.max(0, Number(data.progressPercent) || 0));

    const target = await withDbTimeout(
      prisma.kpiTarget.update({
        where: { id },
        data: {
          actualValue: data.actualValue !== undefined && data.actualValue !== null ? Number(data.actualValue) : null,
          progressPercent: progress,
          employeeNotes: data.employeeNotes ? data.employeeNotes.trim() : null,
          submittedAt: new Date(),
          status: 'SUBMITTED',
        },
      }),
      5000
    );

    revalidatePath('/kpi');
    return { success: true, target };
  } catch (error: any) {
    console.error('submitEmployeeAchievement error:', error);
    return { success: false, error: error?.message || 'Failed to submit self-assessment.' };
  }
}

/**
 * Supervisor reviews and evaluates employee KPI submission
 */
export async function evaluateKpiTarget(
  id: string,
  data: {
    supervisorScore: number;
    supervisorRating: string;
    supervisorFeedback?: string;
    status?: string; // 'APPROVED' | 'REVISION_REQUESTED' | 'REVIEWED'
  }
) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    const existing = await withDbTimeout(
      prisma.kpiTarget.findUnique({
        where: { id },
      }),
      5000,
      null
    );

    if (!existing) {
      return { success: false, error: 'KPI target not found.' };
    }

    const isSupervisor = isAdmin || existing.supervisorId === user.id;

    if (!isSupervisor) {
      return { success: false, error: 'Only designated supervisors or administrators can evaluate submissions.' };
    }

    const score = Math.min(100, Math.max(0, Number(data.supervisorScore) || 0));
    const status = data.status || 'APPROVED';

    const target = await withDbTimeout(
      prisma.kpiTarget.update({
        where: { id },
        data: {
          supervisorScore: score,
          supervisorRating: data.supervisorRating || 'GOOD',
          supervisorFeedback: data.supervisorFeedback ? data.supervisorFeedback.trim() : null,
          reviewedAt: new Date(),
          status,
        },
      }),
      5000
    );

    revalidatePath('/kpi');
    return { success: true, target };
  } catch (error: any) {
    console.error('evaluateKpiTarget error:', error);
    return { success: false, error: error?.message || 'Failed to evaluate KPI target.' };
  }
}

/**
 * Change password for current logged-in employee KPI account
 */
export async function changeKpiPassword(oldPassword: string, newPassword: string) {
  try {
    const user = await getAuthContext();

    if (!oldPassword || !newPassword) {
      return { success: false, error: 'Both current password and new password are required.' };
    }

    if (newPassword.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    const kpiAccount = await withDbTimeout(
      prisma.kpiAccount.findUnique({
        where: { workerId: user.id },
      }),
      5000,
      null
    );

    if (!kpiAccount) {
      return { success: false, error: 'KPI account not found. Please re-login.' };
    }

    const isMatch = await bcrypt.compare(oldPassword, kpiAccount.password);
    if (!isMatch) {
      return { success: false, error: 'Current password does not match.' };
    }

    const newHashed = await bcrypt.hash(newPassword, 10);
    await withDbTimeout(
      prisma.kpiAccount.update({
        where: { id: kpiAccount.id },
        data: { password: newHashed },
      }),
      5000
    );

    return { success: true };
  } catch (error: any) {
    console.error('changeKpiPassword error:', error);
    return { success: false, error: error?.message || 'Failed to change password.' };
  }
}

/**
 * Reset an employee's KPI password back to default (their workerId) by an Admin
 */
export async function resetKpiPasswordToDefault(workerId: string) {
  try {
    const user = await getAuthContext();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    if (!isAdmin) {
      return { success: false, error: 'Only administrators can reset employee passwords.' };
    }

    const worker = await withDbTimeout(
      prisma.worker.findUnique({
        where: { id: workerId },
        include: { kpiAccount: true },
      }),
      5000,
      null
    );

    if (!worker) {
      return { success: false, error: 'Employee not found.' };
    }

    const newHashed = await bcrypt.hash(worker.workerId, 10);

    if (worker.kpiAccount) {
      await withDbTimeout(
        prisma.kpiAccount.update({
          where: { id: worker.kpiAccount.id },
          data: { password: newHashed },
        }),
        5000
      );
    } else {
      await withDbTimeout(
        prisma.kpiAccount.create({
          data: {
            workerId: worker.id,
            loginId: worker.workerId,
            password: newHashed,
            isSupervisor: false,
          },
        }),
        5000
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error('resetKpiPasswordToDefault error:', error);
    return { success: false, error: error?.message || 'Failed to reset employee password.' };
  }
}
