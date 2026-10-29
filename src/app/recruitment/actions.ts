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
  redirect('/recruitment?tab=jobs');
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
        isActive: true,
        isDeleted: false
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


export async function addCandidate(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = (formData.get('email') as string) || null;
  const appliedRole = (formData.get('appliedRole') as string) || 'Sewing Machine Operator';
  const experienceYears = parseFloat((formData.get('experienceYears') as string) || '0') || 0;
  const expectedSalary = parseFloat((formData.get('expectedSalary') as string) || '0') || null;
  const companyId = (formData.get('companyId') as string) || null;
  const departmentId = (formData.get('departmentId') as string) || null;
  let recruitmentId = (formData.get('recruitmentId') as string) || '';

  if (!name || !phone) {
    return { success: false, error: 'Candidate Name and Phone Number are required.' };
  }

  try {
    // If no recruitment selected, attach to the first open recruitment or create a default pipeline container
    if (!recruitmentId) {
      let openRec = await prisma.recruitment.findFirst({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' }
      });
      if (!openRec) {
        openRec = await prisma.recruitment.create({
          data: {
            title: 'General RMG Production Recruitment',
            description: 'Standard factory recruitment pipeline for operators, technicians, and quality staff',
            status: 'OPEN'
          }
        });
      }
      recruitmentId = openRec.id;
    }

    const candidate = await prisma.applicant.create({
      data: {
        name,
        phone,
        email,
        recruitmentId,
        appliedRole,
        experienceYears,
        expectedSalary,
        companyId: companyId && companyId.trim() !== '' ? companyId : null,
        departmentId: departmentId && departmentId.trim() !== '' ? departmentId : null,
        stage: 'APPLIED',
        status: 'APPLIED',
      }
    });

    revalidatePath('/recruitment');
    return { success: true, candidate };
  } catch (err: any) {
    console.error('Failed to add candidate:', err);
    return { success: false, error: err.message || 'Failed to add candidate.' };
  }
}

export async function updateCandidateStage(
  applicantId: string,
  stage: string,
  extra?: {
    testScore?: number;
    testNotes?: string;
    interviewNotes?: string;
    rating?: number;
  }
) {
  try {
    const status = stage === 'HIRED' ? 'HIRED' : stage === 'REJECTED' ? 'REJECTED' : 'INTERVIEWING';

    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        stage,
        status,
        ...(extra?.testScore !== undefined ? { testScore: extra.testScore } : {}),
        ...(extra?.testNotes !== undefined ? { testNotes: extra.testNotes } : {}),
        ...(extra?.interviewNotes !== undefined ? { interviewNotes: extra.interviewNotes } : {}),
        ...(extra?.rating !== undefined ? { rating: extra.rating } : {}),
      }
    });

    revalidatePath('/recruitment');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update stage:', err);
    return { success: false, error: err.message || 'Failed to advance candidate stage.' };
  }
}

export async function onboardCandidate(
  applicantId: string,
  targetCompanyId?: string,
  targetDepartmentId?: string,
  targetSalary?: number
) {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { company: true, department: true }
    });

    if (!applicant) {
      return { success: false, error: 'Applicant not found.' };
    }

    if (applicant.hiredAsWorkerId) {
      return { 
        success: false, 
        error: 'This candidate has already been onboarded as an active employee.',
        workerId: applicant.hiredAsWorkerId 
      };
    }

    // Resolve company
    let companyId = targetCompanyId || applicant.companyId;
    if (!companyId) {
      const defaultCompany = await prisma.company.findFirst({ orderBy: { name: 'asc' } });
      if (!defaultCompany) {
        return { success: false, error: 'No company exists in ERP to attach the new employee to.' };
      }
      companyId = defaultCompany.id;
    }

    // Generate unique worker ID (e.g. EMP-2401)
    let workerId = '';
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      workerId = `EMP-${randomDigits}`;
      const existing = await prisma.worker.findUnique({ where: { workerId } });
      if (!existing) isUnique = true;
    }

    const gross = targetSalary || applicant.expectedSalary || 12500;
    const basic = Math.round(gross * 0.6);
    const houseRent = Math.round(gross * 0.3);
    const medical = Math.round(gross * 0.1);

    // Create the Worker record
    const newWorker = await prisma.worker.create({
      data: {
        workerId,
        name: applicant.name,
        phone: applicant.phone,
        designation: applicant.appliedRole || 'Machine Operator',
        companyId,
        departmentId: targetDepartmentId || applicant.departmentId || null,
        grossSalary: gross,
        basicSalary: basic,
        houseRent,
        medicalAllowance: medical,
        conveyanceAllowance: 0,
        joinDate: new Date(),
        isActive: true,
        isDeleted: false,
      }
    });

    // Record initial joining milestone in career history
    await prisma.careerHistory.create({
      data: {
        workerId: newWorker.id,
        changeType: 'JOINING',
        effectiveDate: new Date(),
        newDesignation: applicant.appliedRole || 'Machine Operator',
        newSalary: gross,
        remarks: `Recruited via ATS Pipeline. Practical test score: ${applicant.testScore ? `${applicant.testScore}/100` : 'Passed'}`
      }
    });

    // Update applicant record with hired link
    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        stage: 'HIRED',
        status: 'HIRED',
        hiredAsWorkerId: newWorker.id,
      }
    });

    revalidatePath('/recruitment');
    revalidatePath('/workers');
    return {
      success: true,
      workerDbId: newWorker.id,
      workerId: newWorker.workerId,
      name: newWorker.name
    };
  } catch (err: any) {
    console.error('Failed to onboard candidate:', err);
    return { success: false, error: err.message || 'Failed to onboard candidate.' };
  }
}
