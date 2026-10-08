import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { Plus, Upload, Layers, Pencil } from 'lucide-react';
import DeleteCompanyButton from '@/components/DeleteCompanyButton';
import { deleteCompany } from './actions';

const prisma = new PrismaClient();

export default async function CompaniesPage() {
  const session = await getSession();
  const role = session?.user?.role;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      departments: {
        include: {
          sections: {
            include: { subSections: true }
          }
        }
      },
      _count: {
        select: { workers: true }
      }
    }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Companies (কোম্পানি)</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Link 
                href="/companies/import" 
            className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700 transition"
          >
            <Upload size={20} /> Import Structure
          </Link>
          <Link 
            href="/companies/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Add Company
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Layers size={20} className="text-blue-600" />
                  {company.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{company.location || 'No location set'}</p>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600 block">Total Workers</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full inline-block mt-1">
                    {company._count.workers}
                  </span>
                </div>
                <div className="border-l pl-4 border-gray-200 flex items-center gap-2">
                  <Link 
                    href={`/companies/${company.id}/edit`}
                    className="text-blue-500 hover:text-blue-700 transition flex items-center"
                    title="Edit Company"
                  >
                    <Pencil size={18} />
                  </Link>
                  <DeleteCompanyButton id={company.id} onDelete={deleteCompany} />
                </div>
              </div>
            </div>
            
            {company.departments.length > 0 ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {company.departments.map(dept => (
                  <div key={dept.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">{dept.name}</h3>
                    {dept.sections.length > 0 ? (
                      <div className="space-y-3">
                        {dept.sections.map(sec => (
                          <div key={sec.id} className="text-sm">
                            <span className="font-semibold text-gray-700 block mb-1">■ {sec.name}</span>
                            {sec.subSections.length > 0 && (
                              <ul className="pl-4 border-l-2 border-gray-200 ml-1 space-y-1 mt-1">
                                {sec.subSections.map(sub => (
                                  <li key={sub.id} className="text-gray-600 relative before:content-[''] before:absolute before:w-2 before:h-px before:bg-gray-300 before:-left-4 before:top-2.5">
                                    {sub.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No sections</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No hierarchy set up for this company. Use Import Structure to build the organization tree.
              </div>
            )}
          </div>
        ))}

        {companies.length === 0 && (
          <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500">
            No companies found. Click "Add Company" or "Import Structure".
          </div>
        )}
      </div>
    </div>
  );
}

