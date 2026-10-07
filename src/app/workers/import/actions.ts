'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function bulkImportWorkers(workers: any[]) {
  try {
    for (const w of workers) {
      const getVal = (keys: string[]) => {
        const foundKey = Object.keys(w).find(k => keys.some(key => k.toLowerCase().trim() === key.toLowerCase()));
        return foundKey ? w[foundKey] : undefined;
      };

      const companyName = getVal(['company', 'company name'])?.trim() || 'Main Company';
      
      let company = await prisma.company.findUnique({ where: { name: companyName } });
      if (!company) {
        company = await prisma.company.create({ data: { name: companyName } });
      }

      let deptId = null;
      const dName = getVal(['department'])?.trim();
      if (dName) {
        let dept = await prisma.department.findFirst({ where: { name: dName, companyId: company.id } });
        if (!dept) dept = await prisma.department.create({ data: { name: dName, companyId: company.id } });
        deptId = dept.id;
      }

      let secId = null;
      const sName = getVal(['section'])?.trim();
      if (deptId && sName) {
        let section = await prisma.section.findFirst({ where: { name: sName, departmentId: deptId } });
        if (!section) section = await prisma.section.create({ data: { name: sName, departmentId: deptId } });
        secId = section.id;
      }

      let subSecId = null;
      const ssName = getVal(['sub section', 'sub-section', 'subsection'])?.trim();
      if (secId && ssName) {
        let subSection = await prisma.subSection.findFirst({ where: { name: ssName, sectionId: secId } });
        if (!subSection) subSection = await prisma.subSection.create({ data: { name: ssName, sectionId: secId } });
        subSecId = subSection.id;
      }

      const record = {
        workerId: getVal(['workerid', 'staff id', 'id']) || `TMP-${Math.floor(Math.random() * 10000)}`,
        name: getVal(['name', 'staff name', 'worker name']) || 'Unknown',
        designation: getVal(['designation']) || null,
        gender: getVal(['gender']) || null,
        bloodGroup: getVal(['bloodgroup', 'blood group']) || null,
        religion: getVal(['religion']) || null,
        nationalId: getVal(['nationalid', 'national id', 'nid']) || null,
        phone: getVal(['phone', 'mobile', 'mobile number']) || null,
        address: getVal(['address', 'present address']) || null,
        permanentAddress: getVal(['permanentaddress', 'permanent address']) || null,
        joinDate: getVal(['joindate', 'join date', 'date of join']) ? new Date(getVal(['joindate', 'join date', 'date of join'])) : new Date(),
        departmentId: deptId,
        sectionId: secId,
        subSectionId: subSecId,
        grade: getVal(['grade']) || null,
        companyId: company.id,
      };

      await prisma.worker.upsert({
        where: { workerId: record.workerId },
        update: record,
        create: record,
      });
    }

    revalidatePath('/workers');
    return { success: true, count: workers.length };
  } catch (error: any) {
    console.error("Bulk import failed:", error);
    return { error: 'Failed to import workers. Check format.' };
  }
}
