'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const deadlineStr = formData.get('deadline') as string;
  
  if (!title) {
    return { error: 'Task title is required' };
  }

  // Normally we would get the creator from session, but using a dummy ID for now
  // Wait, User table is empty! Let's just create a dummy user if none exists, or make creator optional in the schema.
  // Actually, our schema requires creatorId. Let me just fetch the first user, if not, create one.
  
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@erp.com',
        password: 'password',
        role: 'SUPER_ADMIN'
      }
    });
  }

  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  await prisma.task.create({
    data: {
      title,
      description,
      deadline,
      status: 'TODO',
      creatorId: user.id
    }
  });

  revalidatePath('/tasks');
  redirect('/tasks');
}
