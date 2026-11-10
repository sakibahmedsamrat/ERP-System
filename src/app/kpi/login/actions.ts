'use server';

import prisma, { withDbTimeout } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function kpiLoginAction(prevState: any, formData: FormData) {
  try {
    const workerIdRaw = formData.get('workerId') as string;
    const passwordRaw = formData.get('password') as string;

    const workerId = (workerIdRaw || '').trim();
    const password = (passwordRaw || '').trim();

    if (!workerId || !password) {
      return { error: 'Employee ID and password are required.' };
    }

    const worker = await withDbTimeout(
      prisma.worker.findUnique({
        where: { workerId },
        include: {
          kpiAccount: true,
          _count: {
            select: { subordinates: true },
          },
        },
      }),
      5000,
      null
    );

    if (!worker) {
      return { error: 'Employee ID not found. Please contact HR.' };
    }

    if (worker.isDeleted || !worker.isActive) {
      return { error: 'Employee record is inactive or archived. Please contact HR.' };
    }

    let isSupervisor = worker._count.subordinates > 0;

    if (!worker.kpiAccount) {
      // First-time login: Default password is their workerId
      if (password !== worker.workerId) {
        return {
          error: 'Invalid credentials. Your initial default password is your Employee ID Number.',
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await withDbTimeout(
        prisma.kpiAccount.create({
          data: {
            workerId: worker.id,
            loginId: worker.workerId,
            password: hashedPassword,
            isSupervisor,
            lastLogin: new Date(),
          },
        }),
        5000
      );
    } else {
      // Existing KPI Account: Validate hashed password
      const isPasswordValid = await bcrypt.compare(password, worker.kpiAccount.password);
      if (!isPasswordValid) {
        return { error: 'Invalid Employee ID or password.' };
      }

      isSupervisor = isSupervisor || worker.kpiAccount.isSupervisor;

      // Update last login timestamp
      await withDbTimeout(
        prisma.kpiAccount.update({
          where: { id: worker.kpiAccount.id },
          data: { lastLogin: new Date() },
        }),
        5000
      );
    }

    const role = isSupervisor ? 'KPI_SUPERVISOR' : 'KPI_EMPLOYEE';

    await login({
      id: worker.id,
      userId: worker.workerId,
      name: worker.name,
      role,
      modules: 'KPI',
    });
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    console.error('KPI login error:', error);
    return {
      error: error?.message?.includes('timed out')
        ? 'Database connection timed out. Please try again in a moment.'
        : 'An unexpected error occurred during KPI authentication.',
    };
  }

  redirect('/kpi');
}
