'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { parseFlexibleDate } from '@/lib/formatDate';
import { getSession } from '@/lib/auth';
import { logAction } from '@/lib/audit';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully handle calls outside active Next.js request context (e.g. tests)
  }
}

export async function bulkImportWorkers(workers: any[]) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { error: 'Unauthorized: Please log in to perform this action.' };
    }
    const role = session.user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return { error: 'Forbidden: Administrator privileges required to import employees.' };
    }

    if (!Array.isArray(workers) || workers.length === 0) {
      return { error: 'No employee records provided in import payload.' };
    }

    const companiesCache = new Map<string, string>();
    const deptsCache = new Map<string, string>();
    const sectionsCache = new Map<string, string>();
    const subSectionsCache = new Map<string, string>();

    const [allCompanies, allDepts, allSecs, allSubSecs] = await Promise.all([
      prisma.company.findMany(),
      prisma.department.findMany(),
      prisma.section.findMany(),
      prisma.subSection.findMany()
    ]);

    allCompanies.forEach(c => companiesCache.set(c.name.toLowerCase().trim(), c.id));
    allDepts.forEach(d => deptsCache.set(`${d.companyId}_${d.name.toLowerCase().trim()}`, d.id));
    allSecs.forEach(s => sectionsCache.set(`${s.departmentId}_${s.name.toLowerCase().trim()}`, s.id));
    allSubSecs.forEach(s => subSectionsCache.set(`${s.sectionId}_${s.name.toLowerCase().trim()}`, s.id));

    const upsertOperations = [];

    for (const w of workers) {
      const getVal = (keys: string[]) => {
        const objKeys = Object.keys(w);
        // 1. Exact string match (case-insensitive)
        const exactMatch = objKeys.find(k => {
          const lowerK = k.toLowerCase().trim();
          return keys.some(key => lowerK === key.toLowerCase().trim());
        });
        if (exactMatch) return w[exactMatch];

        // 2. Normalized alphanumeric match (ignoring punctuation and spaces)
        const normMatch = objKeys.find(k => {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return keys.some(key => normK === key.toLowerCase().replace(/[^a-z0-9]/g, ''));
        });
        if (normMatch) return w[normMatch];

        // 3. Prefix match for headers annotated with format info, e.g. "Join Date (DD/MM/YY)"
        const prefixMatch = objKeys.find(k => {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          return keys.some(key => {
            const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normKey.length >= 4 && normK.startsWith(normKey);
          });
        });
        return prefixMatch ? w[prefixMatch] : undefined;
      };

      const rawWorkerId = String(getVal(['workerid', 'staff id', 'id', 'worker id', 'employee id']) ?? '').trim();
      const rawName = getVal(['name', 'staff name', 'worker name', 'employee name'])?.toString().trim();

      // Skip empty or comment rows
      if (!rawWorkerId && !rawName) {
        continue;
      }

      // Determine company
      const companyVal = getVal(['company', 'company name'])?.toString().trim();
      let companyId: string | undefined;

      if (companyVal) {
        companyId = companiesCache.get(companyVal.toLowerCase());
        if (!companyId) {
          // Check for punctuation/fuzzy match (e.g. "MEP Fan Limited" vs "MEP Fan Limited.")
          const normalizedVal = companyVal.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const [nameKey, id] of companiesCache.entries()) {
            if (nameKey.replace(/[^a-z0-9]/g, '') === normalizedVal) {
              companyId = id;
              break;
            }
          }
        }
      }

      // If still not matched, fall back to the first existing company instead of creating dummy companies
      if (!companyId) {
        if (allCompanies.length > 0) {
          companyId = allCompanies[0].id;
        } else {
          const newComp = await prisma.company.create({ data: { name: companyVal || 'Main Company' } });
          companyId = newComp.id;
          companiesCache.set((companyVal || 'Main Company').toLowerCase().trim(), companyId);
        }
      }

      let deptId = null;
      const dName = getVal(['department'])?.toString().trim();
      if (dName && companyId) {
        const deptKey = `${companyId}_${dName.toLowerCase()}`;
        deptId = deptsCache.get(deptKey);
        if (!deptId) {
          const dept = await prisma.department.create({ data: { name: dName, companyId } });
          deptId = dept.id;
          deptsCache.set(deptKey, deptId);
        }
      }

      let secId = null;
      const sName = getVal(['section'])?.toString().trim();
      if (deptId && sName) {
        const secKey = `${deptId}_${sName.toLowerCase()}`;
        secId = sectionsCache.get(secKey);
        if (!secId) {
          const section = await prisma.section.create({ data: { name: sName, departmentId: deptId } });
          secId = section.id;
          sectionsCache.set(secKey, secId);
        }
      }

      let subSecId = null;
      const ssName = getVal(['sub section', 'sub-section', 'subsection'])?.toString().trim();
      if (secId && ssName) {
        const subSecKey = `${secId}_${ssName.toLowerCase()}`;
        subSecId = subSectionsCache.get(subSecKey);
        if (!subSecId) {
          const subSection = await prisma.subSection.create({ data: { name: ssName, sectionId: secId } });
          subSecId = subSection.id;
          subSectionsCache.set(subSecKey, subSecId);
        }
      }

      let jDate = new Date();
      const rawDate = getVal([
        'joindate',
        'join date',
        'date of join',
        'joining date',
        'date of joining',
        'joining',
        'doj',
      ]);
      if (rawDate) {
        const d = parseFlexibleDate(rawDate);
        if (d) jDate = d;
      }

      // Handle optional Date of Birth field if included in the import payload
      const rawDob = getVal([
        'date of birth',
        'dateofbirth',
        'birth date',
        'birthdate',
        'dob',
      ]);
      if (rawDob) {
        // Accurately parse birth dates using smart century pivot (e.g. 95 -> 1995, 24 -> 2024)
        parseFlexibleDate(rawDob, { isBirthDate: true });
      }

      const rawGross = parseFloat(getVal(['grosssalary', 'gross salary', 'gross']) || '0');
      let grossSalary = 0;
      let basicSalary = 0;
      let houseRent = 0;
      let conveyanceAllowance = 0;
      let medicalAllowance = 0;

      if (!isNaN(rawGross) && rawGross > 0) {
        grossSalary = rawGross;
        basicSalary = Math.round(grossSalary * 0.50);
        houseRent = Math.round(grossSalary * 0.30);
        conveyanceAllowance = Math.round(grossSalary * 0.10);
        medicalAllowance = Math.round(grossSalary * 0.10);
      }

      // Check if explicit breakdown is provided in the CSV (e.g. from an export file)
      const explicitBasic = parseFloat(getVal(['basicsalary', 'basic salary', 'basic']) || '0');
      if (!isNaN(explicitBasic) && explicitBasic > 0) basicSalary = explicitBasic;
      const explicitHouse = parseFloat(getVal(['houserent', 'house rent']) || '0');
      if (!isNaN(explicitHouse) && explicitHouse > 0) houseRent = explicitHouse;
      const explicitConveyance = parseFloat(getVal(['conveyanceallowance', 'conveyance allowance', 'conveyance']) || '0');
      if (!isNaN(explicitConveyance) && explicitConveyance > 0) conveyanceAllowance = explicitConveyance;
      const explicitMedical = parseFloat(getVal(['medicalallowance', 'medical allowance', 'medical']) || '0');
      if (!isNaN(explicitMedical) && explicitMedical > 0) medicalAllowance = explicitMedical;

      const record = {
        workerId: rawWorkerId || `TMP-${Math.floor(Math.random() * 100000)}`,
        name: rawName || 'Unknown',
        designation: getVal(['designation', 'position', 'job title'])?.toString().trim() || null,
        gender: getVal(['gender', 'sex'])?.toString().trim() || null,
        bloodGroup: getVal(['bloodgroup', 'blood group', 'blood'])?.toString().trim() || null,
        religion: getVal(['religion'])?.toString().trim() || null,
        nationalId: getVal(['nationalid', 'national id', 'nid'])?.toString().trim() || null,
        phone: getVal(['phone', 'mobile', 'mobile number', 'contact', 'phone number'])?.toString().trim() || null,
        address: getVal(['address', 'present address'])?.toString().trim() || null,
        permanentAddress: getVal(['permanentaddress', 'permanent address'])?.toString().trim() || null,
        joinDate: jDate,
        departmentId: deptId,
        sectionId: secId,
        subSectionId: subSecId,
        grade: getVal(['grade'])?.toString().trim() || null,
        companyId: companyId,
        grossSalary,
        basicSalary,
        houseRent,
        conveyanceAllowance,
        medicalAllowance,
      };

      upsertOperations.push(
        prisma.worker.upsert({
          where: { workerId: record.workerId },
          update: {
            ...record,
            isDeleted: false,
            isActive: true,
            deletedAt: null,
          },
          create: {
            ...record,
            isDeleted: false,
            isActive: true,
          },
        })
      );
    }

    if (upsertOperations.length === 0) {
      return { success: true, count: 0 };
    }

    await prisma.$transaction(upsertOperations);

    await logAction(
      'WORKERS',
      'BULK_IMPORT',
      `Bulk imported / updated ${upsertOperations.length} employee record(s) via CSV`
    );

    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/attendance');
    safeRevalidatePath('/confirmations');
    safeRevalidatePath('/id-cards');
    safeRevalidatePath('/payroll');
    safeRevalidatePath('/');

    return { success: true, count: upsertOperations.length };
  } catch (error: any) {
    console.error("Bulk import failed:", error);
    return { error: 'Failed to import workers. Check format and data types.' };
  }
}
