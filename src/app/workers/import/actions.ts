'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function bulkImportWorkers(workers: any[]) {
  try {
    const companiesCache = new Map<string, string>();
    const deptsCache = new Map<string, string>();
    const sectionsCache = new Map<string, string>();
    const subSectionsCache = new Map<string, string>();

    for (const w of workers) {
      const getVal = (keys: string[]) => {
        const foundKey = Object.keys(w).find(k => keys.some(key => k.toLowerCase().trim() === key.toLowerCase()));
        return foundKey ? w[foundKey] : undefined;
      };

      const companyName = getVal(['company', 'company name'])?.trim() || 'Main Company';
      
      let companyId = companiesCache.get(companyName);
      if (!companyId) {
        let company = await prisma.company.findUnique({ where: { name: companyName } });
        if (!company) {
          company = await prisma.company.create({ data: { name: companyName } });
        }
        companyId = company.id;
        companiesCache.set(companyName, companyId);
      }

      let deptId = null;
      const dName = getVal(['department'])?.trim();
      if (dName) {
        const deptKey = \\_\\;
        deptId = deptsCache.get(deptKey);
        if (!deptId) {
          let dept = await prisma.department.findFirst({ where: { name: dName, companyId } });
          if (!dept) dept = await prisma.department.create({ data: { name: dName, companyId } });
          deptId = dept.id;
          deptsCache.set(deptKey, deptId);
        }
      }

      let secId = null;
      const sName = getVal(['section'])?.trim();
      if (deptId && sName) {
        const secKey = \\_\\;
        secId = sectionsCache.get(secKey);
        if (!secId) {
          let section = await prisma.section.findFirst({ where: { name: sName, departmentId: deptId } });
          if (!section) section = await prisma.section.create({ data: { name: sName, departmentId: deptId } });
          secId = section.id;
          sectionsCache.set(secKey, secId);
        }
      }

      let subSecId = null;
      const ssName = getVal(['sub section', 'sub-section', 'subsection'])?.trim();
      if (secId && ssName) {
        const subSecKey = \\_\\;
        subSecId = subSectionsCache.get(subSecKey);
        if (!subSecId) {
          let subSection = await prisma.subSection.findFirst({ where: { name: ssName, sectionId: secId } });
          if (!subSection) subSection = await prisma.subSection.create({ data: { name: ssName, sectionId: secId } });
          subSecId = subSection.id;
          subSectionsCache.set(subSecKey, subSecId);
        }
      }

      let jDate = new Date();
      const rawDate = getVal(['joindate', 'join date', 'date of join']);
      if (rawDate) {
         // handle dd/mm/yyyy or other formats correctly if possible, or fallback to new Date
         const d = new Date(rawDate);
         if (!isNaN(d.getTime())) jDate = d;
      }

      const record = {
        workerId: getVal(['workerid', 'staff id', 'id']) || \TMP-\\,
        name: getVal(['name', 'staff name', 'worker name']) || 'Unknown',
        designation: getVal(['designation']) || null,
        gender: getVal(['gender']) || null,
        bloodGroup: getVal(['bloodgroup', 'blood group']) || null,
        religion: getVal(['religion']) || null,
        nationalId: getVal(['nationalid', 'national id', 'nid'])?.toString() || null,
        phone: getVal(['phone', 'mobile', 'mobile number'])?.toString() || null,
        address: getVal(['address', 'present address']) || null,
        permanentAddress: getVal(['permanentaddress', 'permanent address']) || null,
        joinDate: jDate,
        departmentId: deptId,
        sectionId: secId,
        subSectionId: subSecId,
        grade: getVal(['grade']) || null,
        companyId: companyId,
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
