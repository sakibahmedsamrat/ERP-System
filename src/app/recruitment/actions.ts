'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


export async function createRecruitment(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  if (!title) {
    return { error: 'Title is required' };
  }

  await prisma.recruitment.create({
    data: {
      title,
      description,
      status: 'OPEN'
    }
  });

  revalidatePath('/recruitment');
  redirect('/recruitment');
}
