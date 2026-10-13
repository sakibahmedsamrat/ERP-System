'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function createTask(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const deadlineStr = formData.get('deadline') as string;
  const assigneeId = formData.get('assigneeId') as string;
  
  if (!title) {
    return;
  }

  const session = await getSession();
  
  // Fallback if not logged in (e.g. testing)
  let creatorId = session?.user?.id;
  
  if (!creatorId) {
    let user = await prisma.user.findFirst();
    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await prisma.user.create({
        data: {
          name: 'Admin',
          userId: 'admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
    }
    creatorId = user.id;
  }

  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      deadline,
      status: 'TODO',
      creatorId: creatorId,
      assigneeId: assigneeId || null
    }
  });

  if (assigneeId) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        message: `You have been assigned a new task: ${title}`,
        link: '/tasks'
      }
    });
  }

  revalidatePath('/tasks');
  redirect('/tasks');
}

export async function markTaskDone(taskId: string): Promise<void> {
  const session = await getSession();
  if (!session?.user) return;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: 'DONE' },
    include: { assignee: true }
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
  });

  const userName = task.assignee?.name || session.user.name || 'A user';
  
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        message: `${userName} has completed the task: ${task.title}`,
        link: '/tasks'
      }))
    });
  }
  
  revalidatePath('/tasks');
  revalidatePath('/');
}

export async function deleteTask(taskId: string): Promise<void> {
  const session = await getSession();
  const role = session?.user?.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return;
  }

  await prisma.task.delete({
    where: { id: taskId }
  });
  
  revalidatePath('/tasks');
  revalidatePath('/');
}
