'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function createTraining(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  
  if (!title || !dateStr) {
    return { error: 'Title and date are required' };
  }

  const date = new Date(dateStr);

  await prisma.training.create({
    data: {
      title,
      description,
      location,
      date,
      status: 'SCHEDULED'
    }
  });

  revalidatePath('/training');
  redirect('/training');
}
