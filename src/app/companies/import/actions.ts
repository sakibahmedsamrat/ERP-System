'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function bulkImportHierarchy(data: any[]) {
  try {
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

      // Upsert Company
      let company = await prisma.company.findUnique({ where: { name: companyName } });
      if (!company) {
        company = await prisma.company.create({ data: { name: companyName } });
      }

      if (!deptName) continue;

      // Upsert Department
      let dept = await prisma.department.findFirst({
        where: { name: deptName, companyId: company.id }
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: { name: deptName, companyId: company.id }
        });
      }

      if (!secName) continue;

      // Upsert Section
      let section = await prisma.section.findFirst({
        where: { name: secName, departmentId: dept.id }
      });
      if (!section) {
        section = await prisma.section.create({
          data: { name: secName, departmentId: dept.id }
        });
      }

      if (!subSecName) continue;

      // Upsert SubSection
      let subSection = await prisma.subSection.findFirst({
        where: { name: subSecName, sectionId: section.id }
      });
      if (!subSection) {
        subSection = await prisma.subSection.create({
          data: { name: subSecName, sectionId: section.id }
        });
      }
    }

    revalidatePath('/companies');
    return { success: true };
  } catch (error: any) {
    console.error("Bulk hierarchy import failed:", error);
    return { error: 'Failed to import hierarchy data.' };
  }
}
