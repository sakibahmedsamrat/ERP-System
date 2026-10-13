'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function createRecruitment(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  if (!title) {
    return;
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

export async function updateSubSectionManpower(
  subSectionId: string, 
  authorizedManpower: number,
  remarks?: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized: Please log in first' };
    }

    if (!subSectionId || typeof subSectionId !== 'string') {
      return { success: false, error: 'Sub Section ID is required' };
    }

    const parsedNum = Number(authorizedManpower);
    if (isNaN(parsedNum) || parsedNum < 0) {
      return { success: false, error: 'Authorized manpower must be a non-negative number' };
    }
    const manpowerNum = Math.floor(parsedNum);

    const subSection = await prisma.subSection.findUnique({
      where: { id: subSectionId },
      include: {
        section: {
          include: {
            department: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    if (!subSection) {
      return { success: false, error: 'Sub Section not found' };
    }

    const previousManpower = subSection.authorizedManpower;

    const updated = await prisma.subSection.update({
      where: { id: subSectionId },
      data: {
        authorizedManpower: manpowerNum,
      }
    });

    const companyName = subSection.section?.department?.company?.name || 'Unknown Company';
    const deptName = subSection.section?.department?.name || 'Unknown Dept';
    const secName = subSection.section?.name || 'Unknown Sec';
    const subSecName = subSection.name;

    await logAction(
      'RECRUITMENT',
      'UPDATE_AUTHORIZED_MANPOWER',
      `Updated authorized manpower for ${companyName} > ${deptName} > ${secName} > ${subSecName} from ${previousManpower} to ${manpowerNum}${remarks ? ` (Remarks: ${remarks})` : ''}`
    );

    revalidatePath('/recruitment');
    revalidatePath('/recruitment/manpower');

    return { 
      success: true, 
      message: `Authorized manpower for "${subSecName}" updated to ${manpowerNum}`,
      data: updated 
    };
  } catch (error: any) {
    console.error('Error updating authorized manpower:', error);
    return { success: false, error: error.message || 'Failed to update authorized manpower' };
  }
}

export async function bulkUpdateSectionManpower(
  entries: { subSectionId: string; authorizedManpower: number }[],
  remarks?: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized: Please log in first' };
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return { success: false, error: 'No entries provided' };
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.subSectionId) {
        return { success: false, error: 'Invalid subSectionId in entries' };
      }
      const num = Number(entry.authorizedManpower);
      if (isNaN(num) || num < 0) {
        return { success: false, error: 'All authorized manpower values must be non-negative numbers' };
      }
    }

    const updates = entries.map(entry => {
      const manpowerNum = Math.max(0, Math.floor(Number(entry.authorizedManpower) || 0));
      return prisma.subSection.update({
        where: { id: entry.subSectionId },
        data: { authorizedManpower: manpowerNum }
      });
    });

    await prisma.$transaction(updates);

    await logAction(
      'RECRUITMENT',
      'BULK_UPDATE_AUTHORIZED_MANPOWER',
      `Bulk updated authorized manpower for ${entries.length} sub-sections${remarks ? ` (Remarks: ${remarks})` : ''}`
    );

    revalidatePath('/recruitment');
    revalidatePath('/recruitment/manpower');

    return { success: true, count: entries.length, message: `Updated ${entries.length} sub-sections successfully` };
  } catch (error: any) {
    console.error('Error in bulk update manpower:', error);
    return { success: false, error: error.message || 'Failed to bulk update manpower' };
  }
}

export async function getSubSectionWorkers(subSectionId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized: Please log in first', workers: [] };
    }

    if (!subSectionId) {
      return { success: false, workers: [] };
    }

    const workers = await prisma.worker.findMany({
      where: {
        subSectionId,
        isActive: true
      },
      select: {
        id: true,
        workerId: true,
        name: true,
        designation: true,
        phone: true,
        joinDate: true,
        gender: true,
        photoUrl: true,
        grade: true
      },
      orderBy: { joinDate: 'desc' }
    });

    return { success: true, workers };
  } catch (error: any) {
    console.error('Error fetching sub section workers:', error);
    return { success: false, error: error.message, workers: [] };
  }
}
