'use server'


import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';
import { getSession } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { parseFlexibleDate } from '@/lib/formatDate';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
    revalidateTag('workers');
    revalidateTag('filter-options');
  } catch {
    // Gracefully handle calls outside active Next.js request context (e.g. tests)
  }
}

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
      return `/uploads/${filename}`;
    } catch (diskErr) {
      // Fallback to Data URL for environments without a writable disk
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
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

  const joinDate = (joinDateStr && parseFlexibleDate(joinDateStr)) || new Date();
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
    const session = await getSession();
    if (!session?.user) return { error: 'Unauthorized' };
    const role = session.user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { error: 'Forbidden' };
    }

    const w = await prisma.worker.findUnique({
      where: { id },
      select: { id: true, workerId: true, name: true }
    });
    if (!w) return { error: 'Worker not found' };

    // Soft delete: move to recycle bin
    await prisma.worker.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false
      }
    });

    await logAction('WORKERS', 'DELETE', `Moved worker to recycle bin: ${w.workerId} (${w.name})`);
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/');
    safeRevalidatePath('/payroll');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete worker:", error);
    return { error: 'Failed to delete worker' };
  }
}

export async function restoreWorker(id: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { error: 'Unauthorized' };
    if (session.user.role !== 'SUPER_ADMIN') {
      return { error: 'Forbidden: Only Super Admins can restore employees' };
    }

    const w = await prisma.worker.findUnique({
      where: { id },
      select: { id: true, workerId: true, name: true }
    });
    if (!w) return { error: 'Worker not found' };

    await prisma.worker.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        isActive: true
      }
    });

    await logAction('WORKERS', 'RESTORE', `Restored worker: ${w.workerId} (${w.name})`);
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/settlements');
    safeRevalidatePath('/');
    safeRevalidatePath('/payroll');
    return { success: true };
  } catch (error) {
    console.error("Failed to restore worker:", error);
    return { error: 'Failed to restore worker' };
  }
}

export async function permanentDeleteWorker(id: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { error: 'Unauthorized' };
    if (session.user.role !== 'SUPER_ADMIN') {
      return { error: 'Forbidden: Only Super Admins can permanently delete employees' };
    }

    const w = await prisma.worker.findUnique({
      where: { id },
      select: { id: true, workerId: true, name: true }
    });
    if (!w) return { error: 'Worker not found' };

    // Hard delete related records first
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

    await logAction('WORKERS', 'PERMANENT_DELETE', `Permanently deleted worker: ${w.workerId} (${w.name})`);
    await prisma.worker.delete({ where: { id } });
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/settlements');
    safeRevalidatePath('/');
    safeRevalidatePath('/payroll');
    return { success: true };
  } catch (error) {
    console.error("Failed to permanently delete worker:", error);
    return { error: 'Failed to permanently delete worker' };
  }
}

export async function updateWorker(id: string, formData: FormData): Promise<void> {
  const existing = await prisma.worker.findUnique({
    where: { id },
    select: { id: true, isDeleted: true }
  });
  if (!existing || existing.isDeleted) {
    return;
  }

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
    const parsedJoin = parseFlexibleDate(joinDateStr);
    if (parsedJoin) {
      updateData.joinDate = parsedJoin;
    }
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

export interface MatchedWorkerPreview {
  id: string;
  workerId: string;
  name: string;
  designation: string;
  department: string;
  section: string;
  company: string;
}

export interface BulkDeleteValidationResult {
  success?: boolean;
  error?: string;
  totalEntered?: number;
  matchedWorkers?: MatchedWorkerPreview[];
  alreadyDeleted?: { id: string; workerId: string; name: string }[];
  notFoundIds?: string[];
}

export async function validateBulkDeleteWorkers(rawInput: string): Promise<BulkDeleteValidationResult> {
  try {
    const session = await getSession();
    if (!session?.user) return { error: 'Unauthorized: Please log in to perform this action.' };
    const role = session.user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { error: 'Forbidden: Administrator privileges required.' };
    }

    if (!rawInput || typeof rawInput !== 'string') {
      return { error: 'Please enter at least one Worker ID.' };
    }

    // Strip line bullet markers (e.g. "1. ", "2) ", "- ", "* ") and split on standard delimiters
    const cleanedLines = rawInput
      .split('\n')
      .map(line => line.replace(/^\s*(?:\d+[\.\)\-:]|[-*•])\s*/, '').trim())
      .join('\n');

    // Parse IDs by splitting on commas, newlines, semicolons, tabs, pipes, and spaces
    const tokens = cleanedLines
      .split(/[\s,;|]+/)
      .map(t => t.replace(/^["'\[\]\(\)<>]+|["'\[\]\(\)<>,;.]+$/g, '').trim())
      .filter(t => t.length > 0);

    // Deduplicate while preserving order
    const idList: string[] = [];
    const seen = new Set<string>();
    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        idList.push(token);
      }
    }

    if (idList.length === 0) {
      return { error: 'Please enter at least one valid Worker ID.' };
    }

    // Query active and deleted workers in chunks to guard against PostgreSQL parameter limits
    const chunkSize = 1000;
    const activeWorkers: any[] = [];
    const deletedWorkers: any[] = [];

    for (let i = 0; i < idList.length; i += chunkSize) {
      const chunk = idList.slice(i, i + chunkSize);
      const [activeBatch, deletedBatch] = await Promise.all([
        prisma.worker.findMany({
          where: {
            workerId: { in: chunk, mode: 'insensitive' },
            isDeleted: false,
          },
          select: {
            id: true,
            workerId: true,
            name: true,
            designation: true,
            department: { select: { name: true } },
            section: { select: { name: true } },
            company: { select: { name: true } },
          },
          orderBy: { workerId: 'asc' },
        }),
        prisma.worker.findMany({
          where: {
            workerId: { in: chunk, mode: 'insensitive' },
            isDeleted: true,
          },
          select: {
            id: true,
            workerId: true,
            name: true,
          },
        }),
      ]);
      activeWorkers.push(...activeBatch);
      deletedWorkers.push(...deletedBatch);
    }

    const activeMap = new Map(activeWorkers.map(w => [w.workerId.toLowerCase(), w]));
    const deletedMap = new Map(deletedWorkers.map(w => [w.workerId.toLowerCase(), w]));

    const notFoundIds = idList.filter(
      id => !activeMap.has(id.toLowerCase()) && !deletedMap.has(id.toLowerCase())
    );

    const matchedWorkers: MatchedWorkerPreview[] = activeWorkers.map(w => ({
      id: w.id,
      workerId: w.workerId,
      name: w.name,
      designation: w.designation || 'N/A',
      department: w.department?.name || 'N/A',
      section: w.section?.name || 'N/A',
      company: w.company?.name || 'N/A',
    }));

    const alreadyDeleted = deletedWorkers.map(w => ({
      id: w.id,
      workerId: w.workerId,
      name: w.name,
    }));

    return {
      success: true,
      totalEntered: idList.length,
      matchedWorkers,
      alreadyDeleted,
      notFoundIds,
    };
  } catch (error) {
    console.error('Failed to validate worker IDs for bulk deletion:', error);
    return { error: 'Failed to validate Worker IDs. Please check database connection.' };
  }
}

export async function bulkDeleteWorkers(workerDbIds: string[]) {
  try {
    const session = await getSession();
    if (!session?.user) return { error: 'Unauthorized: Please log in to perform this action.' };
    const role = session.user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { error: 'Forbidden: Administrator privileges required.' };
    }

    if (!Array.isArray(workerDbIds) || workerDbIds.length === 0) {
      return { error: 'No workers selected for deletion.' };
    }

    // Support matching by either database ID or employee Worker ID
    const chunkSize = 1000;
    const activeWorkers: { id: string; workerId: string; name: string }[] = [];

    for (let i = 0; i < workerDbIds.length; i += chunkSize) {
      const chunk = workerDbIds.slice(i, i + chunkSize);
      const batch = await prisma.worker.findMany({
        where: {
          OR: [
            { id: { in: chunk } },
            { workerId: { in: chunk, mode: 'insensitive' } },
          ],
          isDeleted: false,
        },
        select: {
          id: true,
          workerId: true,
          name: true,
        },
      });
      activeWorkers.push(...batch);
    }

    if (activeWorkers.length === 0) {
      return { error: 'No active employees found matching the selected IDs.' };
    }

    const idsToUpdate = activeWorkers.map(w => w.id);
    let totalUpdated = 0;

    for (let i = 0; i < idsToUpdate.length; i += chunkSize) {
      const chunk = idsToUpdate.slice(i, i + chunkSize);
      const updateResult = await prisma.worker.updateMany({
        where: {
          id: { in: chunk },
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      });
      totalUpdated += updateResult.count;
    }

    const sampleSummary = activeWorkers
      .slice(0, 10)
      .map(w => `${w.workerId} (${w.name})`)
      .join(', ');
    const moreSuffix = activeWorkers.length > 10 ? ` and ${activeWorkers.length - 10} more` : '';

    await logAction(
      'WORKERS',
      'BULK_DELETE',
      `Bulk moved ${totalUpdated} worker(s) to recycle bin: ${sampleSummary}${moreSuffix}`
    );

    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/attendance');
    safeRevalidatePath('/confirmations');
    safeRevalidatePath('/id-cards');
    safeRevalidatePath('/payroll');
    safeRevalidatePath('/');

    return {
      success: true,
      count: totalUpdated,
    };
  } catch (error) {
    console.error('Failed to bulk delete workers:', error);
    return { error: 'Failed to bulk delete workers. Please try again.' };
  }
}



export async function uploadWorkerDocument(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const title = formData.get('title') as string;
  const category = (formData.get('category') as string) || 'OTHER';
  const file = formData.get('file') as any;

  if (!workerId || !title) {
    return { success: false, error: 'Worker ID and Document Title are required.' };
  }

  let fileUrl = '';
  let fileType = 'application/octet-stream';
  let fileSize = '';

  if (file && file.size > 0) {
    fileType = file.type || 'image/jpeg';
    fileSize = `${Math.round(file.size / 1024)} KB`;
    const uploaded = await uploadFile(file);
    if (uploaded) fileUrl = uploaded;
  }

  if (!fileUrl) {
    const rawUrl = formData.get('fileUrl') as string;
    if (rawUrl && rawUrl.trim() !== '') {
      fileUrl = rawUrl.trim();
    } else {
      return { success: false, error: 'Please choose a file or provide a valid document URL.' };
    }
  }

  try {
    await prisma.workerDocument.create({
      data: {
        workerId,
        title,
        category,
        fileUrl,
        fileType,
        fileSize,
      }
    });

    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to upload worker document:', err);
    return { success: false, error: err.message || 'Failed to save document.' };
  }
}

export async function deleteWorkerDocument(id: string, workerId: string) {
  try {
    await prisma.workerDocument.delete({
      where: { id }
    });
    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete document:', err);
    return { success: false, error: err.message || 'Failed to delete document.' };
  }
}

export async function addCareerHistory(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const changeType = (formData.get('changeType') as string) || 'PROMOTION';
  const effectiveDateStr = formData.get('effectiveDate') as string;
  const previousDesignation = (formData.get('previousDesignation') as string) || null;
  const newDesignation = (formData.get('newDesignation') as string) || null;
  const previousDepartment = (formData.get('previousDepartment') as string) || null;
  const newDepartment = (formData.get('newDepartment') as string) || null;
  const previousGrade = (formData.get('previousGrade') as string) || null;
  const newGrade = (formData.get('newGrade') as string) || null;
  const previousSalary = parseFloat((formData.get('previousSalary') as string) || '0') || null;
  const newSalary = parseFloat((formData.get('newSalary') as string) || '0') || null;
  const remarks = (formData.get('remarks') as string) || null;

  if (!workerId || !effectiveDateStr) {
    return { success: false, error: 'Worker ID and Effective Date are required.' };
  }

  const effectiveDate = new Date(effectiveDateStr);

  try {
    await prisma.careerHistory.create({
      data: {
        workerId,
        changeType,
        effectiveDate,
        previousDesignation,
        newDesignation,
        previousDepartment,
        newDepartment,
        previousGrade,
        newGrade,
        previousSalary,
        newSalary,
        remarks,
      }
    });

    // Optionally update worker designation/grade if provided
    if (newDesignation || newGrade || (newSalary && newSalary > 0)) {
      await prisma.worker.update({
        where: { id: workerId },
        data: {
          ...(newDesignation ? { designation: newDesignation } : {}),
          ...(newGrade ? { grade: newGrade } : {}),
          ...(newSalary && newSalary > 0 ? { grossSalary: newSalary } : {}),
        }
      });
    }

    safeRevalidatePath(`/workers/${workerId}`);
    safeRevalidatePath('/workers');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to add career history:', err);
    return { success: false, error: err.message || 'Failed to add career event.' };
  }
}

export async function deleteCareerHistory(id: string, workerId: string) {
  try {
    await prisma.careerHistory.delete({
      where: { id }
    });
    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete career history:', err);
    return { success: false, error: err.message || 'Failed to delete career record.' };
  }
}

export async function updateNomineeAndEmergency(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const emergencyContactName = (formData.get('emergencyContactName') as string) || null;
  const emergencyContactPhone = (formData.get('emergencyContactPhone') as string) || null;
  const emergencyContactRelation = (formData.get('emergencyContactRelation') as string) || null;
  const nomineeName = (formData.get('nomineeName') as string) || null;
  const nomineeRelation = (formData.get('nomineeRelation') as string) || null;
  const nomineeNid = (formData.get('nomineeNid') as string) || null;
  const nomineePhone = (formData.get('nomineePhone') as string) || null;

  if (!workerId) {
    return { success: false, error: 'Worker ID is required.' };
  }

  try {
    await prisma.worker.update({
      where: { id: workerId },
      data: {
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        nomineeName,
        nomineeRelation,
        nomineeNid,
        nomineePhone,
      }
    });

    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update nominee/emergency details:', err);
    return { success: false, error: err.message || 'Failed to update details.' };
  }
}

export async function addDisciplinaryRecord(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  const incidentDateStr = formData.get('incidentDate') as string;
  const actionType = (formData.get('actionType') as string) || 'WRITTEN_WARNING';
  const subject = formData.get('subject') as string;
  const description = formData.get('description') as string;
  const actionTaken = (formData.get('actionTaken') as string) || null;
  const status = (formData.get('status') as string) || 'OPEN';

  if (!workerId || !incidentDateStr || !subject || !description) {
    return { success: false, error: 'Worker, Incident Date, Subject, and Description are required.' };
  }

  const incidentDate = new Date(incidentDateStr);

  try {
    await prisma.disciplinaryRecord.create({
      data: {
        workerId,
        incidentDate,
        actionType,
        subject,
        description,
        actionTaken,
        status,
      }
    });

    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to add disciplinary record:', err);
    return { success: false, error: err.message || 'Failed to add record.' };
  }
}

export async function updateDisciplinaryStatus(
  id: string,
  workerId: string,
  status: string,
  actionTaken?: string
) {
  try {
    await prisma.disciplinaryRecord.update({
      where: { id },
      data: {
        status,
        ...(actionTaken !== undefined ? { actionTaken } : {})
      }
    });

    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update disciplinary record status:', err);
    return { success: false, error: err.message || 'Failed to update status.' };
  }
}

export async function deleteDisciplinaryRecord(id: string, workerId: string) {
  try {
    await prisma.disciplinaryRecord.delete({
      where: { id }
    });
    safeRevalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete disciplinary record:', err);
    return { success: false, error: err.message || 'Failed to delete record.' };
  }
}
