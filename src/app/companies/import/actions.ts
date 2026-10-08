'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function bulkImportHierarchy(data: any[]) {
  try {
    const companiesCache = new Map<string, string>();
    const deptsCache = new Map<string, string>();
    const sectionsCache = new Map<string, string>();
    const subSectionsCache = new Map<string, string>();

    for (const row of data) {
      const getVal = (keys: string[]) => {
        const foundKey = Object.keys(row).find(k => keys.some(key => k.toLowerCase().trim() === key.toLowerCase()));
        return foundKey ? row[foundKey] : undefined;
      };

      const companyName = getVal(['company', 'company name'])?.trim();
      const deptName = getVal(['department'])?.trim();
      const secName = getVal(['section'])?.trim();
      const subSecName = getVal(['sub section', 'sub-section', 'subsection'])?.trim();

      if (!companyName) continue;

      let companyId = companiesCache.get(companyName);
      if (!companyId) {
        let company = await prisma.company.findUnique({ where: { name: companyName } });
        if (!company) {
          company = await prisma.company.create({ data: { name: companyName } });
        }
        companyId = company.id;
        companiesCache.set(companyName, companyId);
      }

      if (!deptName) continue;
      
      const deptKey = \\_\\;
      let deptId = deptsCache.get(deptKey);
      if (!deptId) {
        let dept = await prisma.department.findFirst({ where: { name: deptName, companyId } });
        if (!dept) {
          dept = await prisma.department.create({ data: { name: deptName, companyId } });
        }
        deptId = dept.id;
        deptsCache.set(deptKey, deptId);
      }

      if (!secName) continue;

      const secKey = \\_\\;
      let sectionId = sectionsCache.get(secKey);
      if (!sectionId) {
        let section = await prisma.section.findFirst({ where: { name: secName, departmentId: deptId } });
        if (!section) {
          section = await prisma.section.create({ data: { name: secName, departmentId: deptId } });
        }
        sectionId = section.id;
        sectionsCache.set(secKey, sectionId);
      }

      if (!subSecName) continue;

      const subSecKey = \\_\\;
      let subSectionId = subSectionsCache.get(subSecKey);
      if (!subSectionId) {
        let subSection = await prisma.subSection.findFirst({ where: { name: subSecName, sectionId } });
        if (!subSection) {
          subSection = await prisma.subSection.create({ data: { name: subSecName, sectionId } });
        }
        subSectionId = subSection.id;
        subSectionsCache.set(subSecKey, subSectionId);
      }
    }

    revalidatePath('/companies');
    return { success: true };
  } catch (error: any) {
    console.error("Bulk hierarchy import failed:", error);
    return { error: 'Failed to import hierarchy data.' };
  }
}
