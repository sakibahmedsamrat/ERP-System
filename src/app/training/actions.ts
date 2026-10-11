'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


export async function createTraining(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  const workerIds = formData.getAll('workerIds[]') as string[];
  const trainerId = formData.get('trainerId') as string;
  
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
      status: 'SCHEDULED',
      ...(trainerId ? { trainer: { connect: { id: trainerId } } } : {}),
      workers: {
        connect: workerIds.map(id => ({ id }))
      }
    }
  });

  revalidatePath('/training');
  redirect('/training');
}

export async function editTraining(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  const workerIds = formData.getAll('workerIds[]') as string[];
  const trainerId = formData.get('trainerId') as string;
  
  if (!title || !dateStr) {
    return { error: 'Title and date are required' };
  }

  const date = new Date(dateStr);

  await prisma.training.update({
    where: { id },
    data: {
      title,
      description,
      location,
      date,
      trainerId: trainerId || null,
      workers: {
        set: workerIds.map(id => ({ id }))
      }
    }
  });

  revalidatePath('/training');
  redirect('/training');
}

export async function deleteTraining(id: string) {
  await prisma.training.delete({
    where: { id }
  });
  revalidatePath('/training');
}

