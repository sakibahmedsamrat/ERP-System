'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  if (!name) {
    return { error: 'Company name is required' };
  }

  await prisma.company.create({
    data: {
      name,
      location,
    },
  });

  revalidatePath('/companies');
  redirect('/companies');
}

export async function deleteCompany(id: string) {
  try {
    const workerCount = await prisma.worker.count({ where: { companyId: id } });
    if (workerCount > 0) {
      return { error: `Cannot delete company because it has ${workerCount} workers assigned. Please reassign or delete them first.` };
    }

    await prisma.company.delete({
      where: { id },
    });

    revalidatePath('/companies');
    return { success: true };
  } catch (error: any) {
    console.error("Delete company error:", error);
    return { error: 'Failed to delete company. It might have related records.' };
  }
}

export async function updateCompany(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  if (!name) {
    return { error: 'Company name is required' };
  }

  await prisma.company.update({
    where: { id },
    data: {
      name,
      location,
    },
  });

  revalidatePath('/companies');
  redirect('/companies');
}
