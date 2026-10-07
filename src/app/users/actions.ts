'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const userId = formData.get('userId') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const modulesList = formData.getAll('modules') as string[];
  const modulesStr = role === 'SUPER_ADMIN' ? '*' : modulesList.join(',');

  if (!name || !userId || !password || !role) {
    return { error: 'All fields are required' };
  }

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (existing) {
    return { error: 'User ID already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      userId,
      password: hashedPassword,
      role,
      modules: modulesStr
    }
  });

  revalidatePath('/users');
  redirect('/users');
}

export async function deleteUser(id: string) {
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized' };
  }

  // Prevent deleting oneself
  if (id === session.user.id) {
    return { error: 'You cannot delete yourself' };
  }

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete user' };
  }
}

export async function updateUser(formData: FormData) {
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized' };
  }
  
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const modulesList = formData.getAll('modules') as string[];
  const modulesStr = role === 'SUPER_ADMIN' ? '*' : modulesList.join(',');

  if (!id || !name || !role) {
    return { error: 'Missing fields' };
  }

  await prisma.user.update({
    where: { id },
    data: { name, role, modules: modulesStr }
  });

  revalidatePath('/users');
  redirect('/users');
}
