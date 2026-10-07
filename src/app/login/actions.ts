'use server'

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function loginAction(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  const password = formData.get('password') as string;

  if (!userId || !password) {
    return { error: 'User ID and password are required' };
  }

  // Check if any user exists, if not, create a default super admin
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Samrat',
        userId: 'admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        modules: '*'
      }
    });
  }

  const user = await prisma.user.findUnique({
    where: { userId }
  });

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: 'Invalid credentials' };
  }

  await login({ id: user.id, userId: user.userId, name: user.name, role: user.role, modules: user.modules });
  
  redirect('/');
}
