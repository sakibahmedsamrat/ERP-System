'use server';

import prisma, { withDbTimeout } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return [];

    const notifications = await withDbTimeout(
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      3000,
      []
    );

    return notifications || [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

export async function markAsRead(id: string) {
  try {
    if (!id) return;
    await withDbTimeout(
      prisma.notification.update({
        where: { id },
        data: { isRead: true },
      }),
      4000,
      null
    );
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

export async function markAllAsRead() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return;

    await withDbTimeout(
      prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      }),
      4000,
      null
    );
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
}
