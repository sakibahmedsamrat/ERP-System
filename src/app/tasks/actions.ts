'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const deadlineStr = formData.get('deadline') as string;
  const assigneeId = formData.get('assigneeId') as string;
  
  if (!title) {
    return { error: 'Task title is required' };
  }

  const session = await getSession();
  
  // Fallback if not logged in (e.g. testing)
  let creatorId = session?.user?.id;
  
  if (!creatorId) {
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
    creatorId = user.id;
  }

  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  await prisma.task.create({
    data: {
      title,
      description,
      deadline,
      status: 'TODO',
      creatorId: creatorId,
      assigneeId: assigneeId || null
    }
  });

  revalidatePath('/tasks');
  redirect('/tasks');
}

export async function markTaskDone(taskId: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Unauthorized' };

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'DONE' }
  });
  
  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await getSession();
  const role = session?.user?.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return { error: 'Unauthorized' };
  }

  await prisma.task.delete({
    where: { id: taskId }
  });
  
  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true };
}
