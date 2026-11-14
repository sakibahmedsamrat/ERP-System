'use server'

import prisma, { withDbTimeout } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!currentPassword || !newPassword) {
    return { error: 'Both fields are required' };
  }

  const user = await withDbTimeout(
    prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.id },
          ...(session.user.userId ? [{ userId: session.user.userId }] : []),
          { userId: session.user.id }
        ]
      }
    }),
    5000,
    null
  );
  
  if (!user) {
    return { error: 'User not found' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isValid) {
    return { error: 'Incorrect current password' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await withDbTimeout(
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    }),
    5000
  );

  return { success: true };
}

export async function updateProfileImage(base64: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const user = await withDbTimeout(
      prisma.user.findFirst({
        where: {
          OR: [
            { id: session.user.id },
            ...(session.user.userId ? [{ userId: session.user.userId }] : []),
            { userId: session.user.id }
          ]
        },
        select: { id: true }
      }),
      5000,
      null
    );

    if (user) {
      await withDbTimeout(
        prisma.user.update({
          where: { id: user.id },
          data: { profileImage: base64 }
        }),
        6000
      );
    } else {
      const worker = await withDbTimeout(
        prisma.worker.findFirst({
          where: {
            OR: [
              { id: session.user.id },
              ...(session.user.userId ? [{ workerId: session.user.userId }] : []),
              { workerId: session.user.id }
            ]
          },
          select: { id: true }
        }),
        5000,
        null
      );

      if (worker) {
        await withDbTimeout(
          prisma.worker.update({
            where: { id: worker.id },
            data: { photoUrl: base64 }
          }),
          6000
        );
      } else {
        return { error: 'User record not found' };
      }
    }

    // Revalidate layout and cached user profile to pick up new image immediately
    try {
      revalidateTag('user-profile');
    } catch {}
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/settings');
    } catch {}

    return { success: true, profileImage: base64 };
  } catch (error: any) {
    console.error('Update profile image error:', error);
    return { error: 'Failed to save profile image: ' + (error?.message || 'Database error') };
  }
}

export async function removeProfileImage() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const user = await withDbTimeout(
      prisma.user.findFirst({
        where: {
          OR: [
            { id: session.user.id },
            ...(session.user.userId ? [{ userId: session.user.userId }] : []),
            { userId: session.user.id }
          ]
        },
        select: { id: true }
      }),
      5000,
      null
    );

    if (user) {
      await withDbTimeout(
        prisma.user.update({
          where: { id: user.id },
          data: { profileImage: null }
        }),
        6000
      );
    } else {
      const worker = await withDbTimeout(
        prisma.worker.findFirst({
          where: {
            OR: [
              { id: session.user.id },
              ...(session.user.userId ? [{ workerId: session.user.userId }] : []),
              { workerId: session.user.id }
            ]
          },
          select: { id: true }
        }),
        5000,
        null
      );

      if (worker) {
        await withDbTimeout(
          prisma.worker.update({
            where: { id: worker.id },
            data: { photoUrl: null }
          }),
          6000
        );
      } else {
        return { error: 'User record not found' };
      }
    }

    try {
      revalidateTag('user-profile');
    } catch {}
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/settings');
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error('Remove profile image error:', error);
    return { error: 'Failed to remove profile image: ' + (error?.message || 'Database error') };
  }
}
