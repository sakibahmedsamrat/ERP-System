'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';


export async function createCompany(formData: FormData): Promise<void> {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  if (!name) {
    return;
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
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized. Only Super Admin can delete companies.' };
  }
  try {
    const workerCount = await prisma.worker.count({ where: { companyId: id, isDeleted: false } });
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

export async function updateCompany(id: string, formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return;
  }
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  if (!name) {
    return;
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

