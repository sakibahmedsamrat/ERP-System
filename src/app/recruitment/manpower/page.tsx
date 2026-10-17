import prisma from '@/lib/prisma';
import ManpowerEntryClient from './ManpowerEntryClient';
import { HierarchyCompany } from '../RecruitmentClient';

export const dynamic = 'force-dynamic';

export default async function ManpowerEntryPage({
  searchParams
}: {
  searchParams?: {
    companyId?: string;
    deptId?: string;
    sectionId?: string;
    subSectionId?: string;
  };
}) {
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    include: {
      departments: {
        orderBy: { name: 'asc' },
        include: {
          sections: {
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  workers: {
                    where: { isActive: true, isDeleted: false }
                  }
                }
              },
              subSections: {
                orderBy: { name: 'asc' },
                include: {
                  _count: {
                    select: {
                      workers: {
                        where: { isActive: true, isDeleted: false }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const serializableCompanies: HierarchyCompany[] = companies.map(c => ({
    id: c.id,
    name: c.name,
    departments: c.departments.map(d => ({
      id: d.id,
      name: d.name,
      sections: d.sections.map(s => ({
        id: s.id,
        name: s.name,
        _count: {
          workers: s._count?.workers || 0
        },
        subSections: s.subSections.map(sub => ({
          id: sub.id,
          name: sub.name,
          authorizedManpower: sub.authorizedManpower || 0,
          _count: {
            workers: sub._count?.workers || 0
          }
        }))
      }))
    }))
  }));

  return (
    <ManpowerEntryClient 
      companies={serializableCompanies} 
      initialSelection={searchParams}
    />
  );
}
