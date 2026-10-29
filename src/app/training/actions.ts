'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


export async function createTraining(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  const workerIds = formData.getAll('workerIds[]') as string[];
  const trainerId = formData.get('trainerId') as string;
  
  if (!title || !dateStr) {
    return;
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

export async function editTraining(id: string, formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  const workerIds = formData.getAll('workerIds[]') as string[];
  const trainerId = formData.get('trainerId') as string;
  
  if (!title || !dateStr) {
    return;
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
  try {
    await prisma.training.delete({
      where: { id }
    });
    revalidatePath('/training');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete training:", error);
    return { error: 'Failed to delete training' };
  }
}



export async function addWorkerSkill(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const skillCategory = (formData.get('skillCategory') as string) || 'SEWING';
  const skillName = formData.get('skillName') as string;
  const proficiency = (formData.get('proficiency') as string) || 'INTERMEDIATE';
  const certifiedDateStr = formData.get('certifiedDate') as string;
  const expiryDateStr = formData.get('expiryDate') as string;
  const certifyingBody = (formData.get('certifyingBody') as string) || 'Internal MEP';

  if (!workerId || !skillName) {
    return { success: false, error: 'Worker and Skill Name are required.' };
  }

  try {
    const certifiedDate = certifiedDateStr ? new Date(certifiedDateStr) : null;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    let status = 'VALID';
    if (expiryDate) {
      const now = new Date();
      if (expiryDate < now) {
        status = 'EXPIRED';
      } else if (expiryDate.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 60) {
        status = 'EXPIRING_SOON';
      }
    }

    await prisma.workerSkill.create({
      data: {
        workerId,
        skillCategory,
        skillName,
        proficiency,
        certifiedDate,
        expiryDate,
        certifyingBody,
        status,
      }
    });

    revalidatePath('/training');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to add worker skill:', err);
    return { success: false, error: err.message || 'Failed to record worker skill.' };
  }
}

export async function deleteWorkerSkill(id: string) {
  try {
    await prisma.workerSkill.delete({
      where: { id }
    });
    revalidatePath('/training');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete worker skill:', err);
    return { success: false, error: err.message || 'Failed to delete skill.' };
  }
}

export async function addComplianceCertification(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const type = (formData.get('type') as string) || 'FIRE_SAFETY';
  const issueDateStr = formData.get('issueDate') as string;
  const expiryDateStr = formData.get('expiryDate') as string;
  const certificateNumber = (formData.get('certificateNumber') as string) || null;
  const issuingAuthority = (formData.get('issuingAuthority') as string) || 'Fire Service & Civil Defence';

  if (!workerId || !issueDateStr || !expiryDateStr) {
    return { success: false, error: 'Worker, Issue Date, and Expiry Date are required.' };
  }

  try {
    const issueDate = new Date(issueDateStr);
    const expiryDate = new Date(expiryDateStr);

    const now = new Date();
    let status = 'ACTIVE';
    if (expiryDate < now) {
      status = 'EXPIRED';
    } else if (expiryDate.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 60) {
      status = 'EXPIRING_SOON';
    }

    await prisma.complianceCertification.create({
      data: {
        workerId,
        type,
        issueDate,
        expiryDate,
        certificateNumber,
        issuingAuthority,
        status,
      }
    });

    revalidatePath('/training');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to add compliance certification:', err);
    return { success: false, error: err.message || 'Failed to add certification.' };
  }
}

export async function deleteComplianceCertification(id: string) {
  try {
    await prisma.complianceCertification.delete({
      where: { id }
    });
    revalidatePath('/training');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete certification:', err);
    return { success: false, error: err.message || 'Failed to delete certification.' };
  }
}
