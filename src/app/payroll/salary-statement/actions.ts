'use server';

import prisma, { withDbTimeout } from '@/lib/prisma';
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

    if (!input.refNo || !input.refNo.trim()) {
      return { success: false, error: 'Reference Number is required.' };
    }
    if (!input.name || !input.name.trim()) {
      return { success: false, error: 'Employee Name is required.' };
    }
    if (!input.data || typeof input.data !== 'object') {
      return { success: false, error: 'Statement document data is required.' };
    }

    let workerDbId: string | null = null;
    if (input.workerId && input.workerId.trim()) {
      const cleanWorkerId = input.workerId.trim();
      const worker = await withDbTimeout(
        prisma.worker.findFirst({
          where: {
            OR: [{ workerId: cleanWorkerId }, { id: cleanWorkerId }],
          },
          select: { id: true },
        }),
        8000
      );
      if (worker) {
        workerDbId = worker.id;
      }
    }

    if (input.id) {
      // Check if statement exists
      const existing = await withDbTimeout(
        prisma.salaryStatement.findUnique({
          where: { id: input.id },
        }),
        8000
      );

      if (!existing) {
        return { success: false, error: 'Salary statement not found to update.' };
      }

      const updated = await withDbTimeout(
        prisma.salaryStatement.update({
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
        }),
        8000
      );

      await logAction(
        'PAYROLL',
        'UPDATE_SALARY_STATEMENT',
        `Updated salary statement Ref: ${updated.refNo} for ${updated.name} (Worker ID: ${updated.workerId || 'N/A'})`
      );

      revalidatePath('/payroll/salary-statement');
      revalidatePath('/salary-statement');

      return { success: true, statement: updated };
    } else {
      const created = await withDbTimeout(
        prisma.salaryStatement.create({
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
        }),
        8000
      );

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
      const terms = search.split(/\s+/).filter(Boolean);
      if (terms.length === 1) {
        const term = terms[0];
        whereClause.OR = [
          { refNo: { contains: term, mode: 'insensitive' } },
          { workerId: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { designation: { contains: term, mode: 'insensitive' } },
          { department: { contains: term, mode: 'insensitive' } },
          { statementDate: { contains: term, mode: 'insensitive' } },
        ];
      } else if (terms.length > 1) {
        whereClause.AND = terms.map((term) => ({
          OR: [
            { refNo: { contains: term, mode: 'insensitive' } },
            { workerId: { contains: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } },
            { designation: { contains: term, mode: 'insensitive' } },
            { department: { contains: term, mode: 'insensitive' } },
            { statementDate: { contains: term, mode: 'insensitive' } },
          ],
        }));
      }
    }

    const [total, statements] = await withDbTimeout(
      Promise.all([
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
          },
        }),
      ]),
      8000
    );

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

    if (!id || typeof id !== 'string' || !id.trim()) {
      return { success: false, error: 'Valid statement ID is required', statement: null };
    }

    const statement = await withDbTimeout(
      prisma.salaryStatement.findUnique({
        where: { id: id.trim() },
      }),
      8000
    );

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

    if (!id || typeof id !== 'string' || !id.trim()) {
      return { success: false, error: 'Valid statement ID is required' };
    }

    const cleanId = id.trim();
    const existing = await withDbTimeout(
      prisma.salaryStatement.findUnique({
        where: { id: cleanId },
        select: { id: true, refNo: true, name: true },
      }),
      8000
    );

    if (!existing) {
      return { success: false, error: 'Salary statement not found to delete.' };
    }

    await withDbTimeout(
      prisma.salaryStatement.delete({
        where: { id: cleanId },
      }),
      8000
    );

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
