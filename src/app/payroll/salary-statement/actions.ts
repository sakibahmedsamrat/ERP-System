'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

async function checkAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    return { authorized: false, error: 'Unauthorized: Please log in', session: null };
  }
  const role = session.user.role;
  const userModules = (session.user.modules || '')
    .split(',')
    .map((m: string) => m.trim().toUpperCase());
  const hasAccess =
    role === 'SUPER_ADMIN' ||
    session.user.modules === '*' ||
    userModules.includes('PAYROLL') ||
    userModules.includes('SETTLEMENTS');

  if (!hasAccess) {
    return {
      authorized: false,
      error: 'Unauthorized: Access to Payroll is restricted',
      session,
    };
  }
  return { authorized: true, error: null, session };
}

export interface SaveSalaryStatementInput {
  id?: string;
  refNo: string;
  workerId?: string;
  name: string;
  designation?: string;
  department?: string;
  statementDate?: string;
  data: any;
}

export async function saveSalaryStatement(input: SaveSalaryStatementInput) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    if (!input.refNo || !input.name) {
      return { success: false, error: 'Reference Number and Employee Name are required.' };
    }

    let workerDbId: string | null = null;
    if (input.workerId && input.workerId.trim()) {
      const cleanWorkerId = input.workerId.trim();
      const worker = await prisma.worker.findFirst({
        where: {
          OR: [{ workerId: cleanWorkerId }, { id: cleanWorkerId }],
        },
        select: { id: true },
      });
      if (worker) {
        workerDbId = worker.id;
      }
    }

    if (input.id) {
      // Check if statement exists
      const existing = await prisma.salaryStatement.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        return { success: false, error: 'Salary statement not found to update.' };
      }

      const updated = await prisma.salaryStatement.update({
        where: { id: input.id },
        data: {
          refNo: input.refNo.trim(),
          workerId: input.workerId ? input.workerId.trim() : null,
          workerDbId,
          name: input.name.trim(),
          designation: input.designation ? input.designation.trim() : null,
          department: input.department ? input.department.trim() : null,
          statementDate: input.statementDate ? input.statementDate.trim() : null,
          data: input.data,
          updatedAt: new Date(),
        },
      });

      await logAction(
        'PAYROLL',
        'UPDATE_SALARY_STATEMENT',
        `Updated salary statement Ref: ${updated.refNo} for ${updated.name} (Worker ID: ${updated.workerId || 'N/A'})`
      );

      revalidatePath('/payroll/salary-statement');
      revalidatePath('/salary-statement');

      return { success: true, statement: updated };
    } else {
      const created = await prisma.salaryStatement.create({
        data: {
          refNo: input.refNo.trim(),
          workerId: input.workerId ? input.workerId.trim() : null,
          workerDbId,
          name: input.name.trim(),
          designation: input.designation ? input.designation.trim() : null,
          department: input.department ? input.department.trim() : null,
          statementDate: input.statementDate ? input.statementDate.trim() : null,
          data: input.data,
          createdById: (auth.session?.user as any)?.id || (auth.session?.user as any)?.userId || null,
        },
      });

      await logAction(
        'PAYROLL',
        'CREATE_SALARY_STATEMENT',
        `Created salary statement Ref: ${created.refNo} for ${created.name} (Worker ID: ${created.workerId || 'N/A'})`
      );

      revalidatePath('/payroll/salary-statement');
      revalidatePath('/salary-statement');

      return { success: true, statement: created };
    }
  } catch (err: any) {
    console.error('Failed to save salary statement:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while saving the statement.',
    };
  }
}

export async function getSavedSalaryStatements(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) {
      return {
        success: false,
        error: auth.error,
        statements: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }

    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, Math.min(100, params?.limit || 20));
    const search = params?.search?.trim();

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { refNo: { contains: search, mode: 'insensitive' } },
        { workerId: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { statementDate: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, statements] = await Promise.all([
      prisma.salaryStatement.count({ where: whereClause }),
      prisma.salaryStatement.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          refNo: true,
          workerId: true,
          workerDbId: true,
          name: true,
          designation: true,
          department: true,
          statementDate: true,
          createdAt: true,
          updatedAt: true,
          data: true,
        },
      }),
    ]);

    return {
      success: true,
      statements,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    console.error('Failed to get saved salary statements:', err);
    return {
      success: false,
      error: err.message || 'Failed to retrieve saved statements',
      statements: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

export async function getSalaryStatementById(id: string) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) {
      return { success: false, error: auth.error, statement: null };
    }

    const statement = await prisma.salaryStatement.findUnique({
      where: { id },
    });

    if (!statement) {
      return { success: false, error: 'Salary statement not found', statement: null };
    }

    return { success: true, statement };
  } catch (err: any) {
    console.error('Failed to get salary statement by id:', err);
    return {
      success: false,
      error: err.message || 'Failed to retrieve salary statement',
      statement: null,
    };
  }
}

export async function deleteSalaryStatement(id: string) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const existing = await prisma.salaryStatement.findUnique({
      where: { id },
      select: { id: true, refNo: true, name: true },
    });

    if (!existing) {
      return { success: false, error: 'Salary statement not found to delete.' };
    }

    await prisma.salaryStatement.delete({
      where: { id },
    });

    await logAction(
      'PAYROLL',
      'DELETE_SALARY_STATEMENT',
      `Deleted salary statement Ref: ${existing.refNo} for ${existing.name}`
    );

    revalidatePath('/payroll/salary-statement');
    revalidatePath('/salary-statement');

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete salary statement:', err);
    return {
      success: false,
      error: err.message || 'Failed to delete salary statement',
    };
  }
}
