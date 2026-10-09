'use server'

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!currentPassword || !newPassword) {
    return { error: 'Both fields are required' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  if (!user) {
    return { error: 'User not found' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isValid) {
    return { error: 'Incorrect current password' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  return { success: true };
}
export async function updateProfileImage(base64: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileImage: base64 }
  });

  // Revalidate layout to pick up new image
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/', 'layout');
}
