'use server';

import prisma, { withDbTimeout } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const password = formData.get('password') as string;

    if (!userId || !password) {
      return { error: 'User ID and password are required' };
    }

    // Check if any user exists, if not, create a default super admin (with fast timeout fallback)
    const userCount = await withDbTimeout(prisma.user.count(), 5000, 1);
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await withDbTimeout(
        prisma.user.create({
          data: {
            name: 'Samrat',
            userId: 'admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            modules: '*',
          },
        }),
        5000
      );
    }

    const user = await withDbTimeout(
      prisma.user.findUnique({
        where: { userId },
      }),
      5000,
      null
    );

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { error: 'Invalid credentials' };
    }

    await login({ id: user.id, userId: user.userId, name: user.name, role: user.role, modules: user.modules });
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    console.error('Login action error:', error);
    return {
      error: error?.message?.includes('timed out')
        ? 'Database connection timed out. Please check database connectivity.'
        : 'An unexpected error occurred during sign in. Please try again.',
    };
  }

  redirect('/');
}
