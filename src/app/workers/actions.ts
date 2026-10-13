'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';
import { writeFile } from 'fs/promises';
import { join } from 'path';


async function uploadFile(file: any): Promise<string | null> {
  if (!file || !file.name || file.size === 0) return null;
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type || 'image/jpeg';
    
    // Save to disk if filesystem is writable
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const path = join(process.cwd(), 'public/uploads', filename);
      await writeFile(path, buffer);
    } catch (diskErr) {
      // Ignore disk write errors in serverless environments
    }

    // Return Data URL for 100% reliable image loading without 404s or CORS blocks
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error("File upload error:", err);
    return null;
  }
}

export async function createWorker(formData: FormData): Promise<void> {
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
    return;
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
    return;
  }

  await logAction('WORKERS', 'CREATE', 'Created worker: ' + workerId);
  revalidatePath('/workers');
  redirect('/workers');
}

export async function deleteWorker(id: string) {
  try {
    const w = await prisma.worker.findUnique({
      where: { id },
      select: { id: true, workerId: true }
    });
    if (!w) return { error: 'Worker not found' };

    // Delete related attendances and settlements first
    await prisma.attendance.deleteMany({ where: { workerId: id } });
    await prisma.settlement.deleteMany({ where: { workerId: id } });
    await prisma.training.updateMany({
      where: { trainerId: id },
      data: { trainerId: null }
    });

    const trainingsWithWorker = await prisma.training.findMany({
      where: { workers: { some: { id } } },
      select: { id: true }
    });
    for (const t of trainingsWithWorker) {
      await prisma.training.update({
        where: { id: t.id },
        data: { workers: { disconnect: { id } } }
      });
    }

    await logAction('WORKERS', 'DELETE', 'Deleted worker: ' + w.workerId);
    await prisma.worker.delete({ where: { id } });
    revalidatePath('/workers');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete worker:", error);
    return { error: 'Failed to delete worker' };
  }
}

export async function updateWorker(id: string, formData: FormData): Promise<void> {
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
    return;
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
    return;
  }

  await logAction('WORKERS', 'UPDATE', 'Updated worker: ' + workerId);
  revalidatePath('/workers');
  redirect('/workers');
}

