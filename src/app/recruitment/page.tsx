import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import RecruitmentClient, { SubSectionManpowerItem, HierarchyCompany, JobItem } from './RecruitmentClient';

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage() {
  const session = await getSession();
  const userRole = session?.user?.role;

  // Fetch companies with departments, sections, and sub-sections with active worker counts
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
                    where: { isActive: true }
                  }
                }
              },
              subSections: {
                orderBy: { name: 'asc' },
                include: {
                  _count: {
                    select: {
                      workers: {
                        where: { isActive: true }
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

  // Flatten into table items
  const items: SubSectionManpowerItem[] = [];

  for (const company of companies) {
    for (const dept of company.departments) {
      for (const section of dept.sections) {
        for (const sub of section.subSections) {
          const auth = sub.authorizedManpower || 0;
          const exist = sub._count?.workers || 0;
          items.push({
            id: sub.id,
            name: sub.name,
            sectionId: section.id,
            sectionName: section.name,
            departmentId: dept.id,
            departmentName: dept.name,
            companyId: company.id,
            companyName: company.name,
            authorizedManpower: auth,
            existingManpower: exist,
            remaining: auth - exist,
          });
        }
      }
    }
  }

  // Fetch existing job circulars
  const recruitmentsData = await prisma.recruitment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { applicants: true }
      }
    }
  });

  const recruitments: JobItem[] = recruitmentsData.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    _count: r._count
  }));

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
    <Suspense fallback={
      <div className="p-8 text-center text-gray-500 font-medium flex items-center justify-center min-h-[400px]">
        Loading recruitment data...
      </div>
    }>
      <RecruitmentClient
        initialItems={items}
        recruitments={recruitments}
        companies={serializableCompanies}
        userRole={userRole}
      />
    </Suspense>
  );
}
