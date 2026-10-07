'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function uploadFile(file: any): Promise<string | null> {
  if (!file || !file.name || file.size === 0) return null;
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const path = join(process.cwd(), 'public/uploads', filename);
    await writeFile(path, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("File upload error:", err);
    return null;
  }
}

export async function createWorker(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const permanentAddress = formData.get('permanentAddress') as string;
  const companyId = formData.get('companyId') as string;
  const departmentId = formData.get('departmentId') as string || null;
  const sectionId = formData.get('sectionId') as string || null;
  const subSectionId = formData.get('subSectionId') as string || null;
  const designation = formData.get('designation') as string;
  const gender = formData.get('gender') as string;
  const bloodGroup = formData.get('bloodGroup') as string;
  const religion = formData.get('religion') as string;
  const nationalId = formData.get('nationalId') as string;
  const joinDateStr = formData.get('joinDate') as string;
  const grade = formData.get('grade') as string;

  const photoFile = formData.get('photo');
  const signatureFile = formData.get('signature');

  const photoUrl = await uploadFile(photoFile);
  const signatureUrl = await uploadFile(signatureFile);

  if (!workerId || !name || !companyId) {
    return { error: 'Worker ID, Name, and Company are required' };
  }

  const joinDate = joinDateStr ? new Date(joinDateStr) : new Date();
  const getFloat = (field: string) => {
    const val = formData.get(field) as string;
    return val ? parseFloat(val) : 0;
  };

  try {
    await prisma.worker.create({
      data: {
        workerId, name, phone, address, permanentAddress, companyId,
        departmentId, designation, gender, bloodGroup, religion,
        nationalId, joinDate, sectionId, subSectionId, grade,
        photoUrl, signatureUrl,
        grossSalary: getFloat('grossSalary'),
        basicSalary: getFloat('basicSalary'),
        houseRent: getFloat('houseRent'),
        conveyanceAllowance: getFloat('conveyanceAllowance'),
        medicalAllowance: getFloat('medicalAllowance'),
      },
    });
  } catch (error: any) {
    console.error("Failed to create worker:", error);
    return { error: 'Failed to create worker (Worker ID must be unique)' };
  }

  revalidatePath('/workers');
  redirect('/workers');
}

export async function deleteWorker(id: string) {
  try {
    // Delete related attendances and settlements first
    await prisma.attendance.deleteMany({ where: { workerId: id } });
    await prisma.settlement.deleteMany({ where: { workerId: id } });
    await prisma.worker.delete({ where: { id } });
    revalidatePath('/workers');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete worker:", error);
    return { error: 'Failed to delete worker' };
  }
}

export async function updateWorker(id: string, formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const permanentAddress = formData.get('permanentAddress') as string;
  const companyId = formData.get('companyId') as string;
  const departmentId = formData.get('departmentId') as string || null;
  const sectionId = formData.get('sectionId') as string || null;
  const subSectionId = formData.get('subSectionId') as string || null;
  const designation = formData.get('designation') as string;
  const gender = formData.get('gender') as string;
  const bloodGroup = formData.get('bloodGroup') as string;
  const religion = formData.get('religion') as string;
  const nationalId = formData.get('nationalId') as string;
  const joinDateStr = formData.get('joinDate') as string;
  const grade = formData.get('grade') as string;

  const photoFile = formData.get('photo');
  const signatureFile = formData.get('signature');

  const updateData: any = {
    workerId, name, phone, address, permanentAddress, companyId,
    departmentId, designation, gender, bloodGroup, religion,
    nationalId, sectionId, subSectionId, grade,
  };

  const photoUrl = await uploadFile(photoFile);
  if (photoUrl) updateData.photoUrl = photoUrl;

  const signatureUrl = await uploadFile(signatureFile);
  if (signatureUrl) updateData.signatureUrl = signatureUrl;

  if (joinDateStr) {
    updateData.joinDate = new Date(joinDateStr);
  }

  if (!workerId || !name || !companyId) {
    return { error: 'Worker ID, Name, and Company are required' };
  }

  const getFloat = (field: string) => {
    const val = formData.get(field) as string;
    return val ? parseFloat(val) : 0;
  };

  updateData.grossSalary = getFloat('grossSalary');
  updateData.basicSalary = getFloat('basicSalary');
  updateData.houseRent = getFloat('houseRent');
  updateData.conveyanceAllowance = getFloat('conveyanceAllowance');
  updateData.medicalAllowance = getFloat('medicalAllowance');

  try {
    await prisma.worker.update({
      where: { id },
      data: updateData,
    });
  } catch (error: any) {
    console.error("Failed to update worker:", error);
    return { error: 'Failed to update worker' };
  }

  revalidatePath('/workers');
  redirect('/workers');
}
