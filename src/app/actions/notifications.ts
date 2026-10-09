'use server'

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getNotifications() {
  const session = await getSession();
  if (!session?.user) return [];

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return notifications;
}

export async function markAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
  revalidatePath('/');
}

export async function markAllAsRead() {
  const session = await getSession();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  });
  revalidatePath('/');
}
