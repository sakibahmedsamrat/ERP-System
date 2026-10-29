import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { Plus, Upload, Layers, Pencil, Building2, Sparkles } from 'lucide-react';
import DeleteCompanyButton from '@/components/DeleteCompanyButton';
import { deleteCompany } from './actions';

export default async function CompaniesPage() {
  const session = await getSession();
  const role = session?.user?.role;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Organizational Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Companies</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage corporate sister concerns, departments, sections, and organizational hierarchies
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <Link 
                href="/companies/import" 
                prefetch={true}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition text-xs font-bold shadow-sm shadow-purple-600/20"
              >
                <Upload size={16} /> Import Structure
              </Link>
              <Link 
                href="/companies/new" 
                prefetch={true}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition text-xs font-bold shadow-md shadow-blue-600/20"
              >
                <Plus size={16} /> Add Company
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {companies.map((company) => (
          <div key={company.id} className="glass-card rounded-3xl border border-white/70 shadow-sm overflow-hidden">
            <div className="bg-white/60 backdrop-blur-md p-5 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-200/50">
                    <Building2 size={20} />
                  </div>
                  <span>{company.name}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 pl-10">{company.location || 'No location set'}</p>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Workers</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold px-3 py-0.5 rounded-full inline-block mt-0.5 shadow-xs">
                    {company._count.workers}
                  </span>
                </div>
                {isSuperAdmin && (
                  <div className="border-l border-slate-200/80 pl-4 flex items-center gap-2">
                    <Link 
                      href={`/companies/${company.id}/edit`}
                      prefetch={true}
                      className="text-blue-600 hover:text-blue-800 transition p-1.5 rounded-lg hover:bg-white"
                      title="Edit Company"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteCompanyButton id={company.id} onDelete={deleteCompany} />
                  </div>
                )}
              </div>
            </div>
            
            {company.departments.length > 0 ? (
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {company.departments.map(dept => (
                  <div key={dept.id} className="bg-white/70 backdrop-blur-xs border border-slate-200/70 rounded-2xl p-4 shadow-xs">
                    <h3 className="font-bold text-slate-800 border-b border-slate-200/60 pb-2 mb-3 text-sm flex items-center gap-2">
                      <Layers size={15} className="text-indigo-600" />
                      <span>{dept.name}</span>
                    </h3>
                    {dept.sections.length > 0 ? (
                      <div className="space-y-3">
                        {dept.sections.map(sec => (
                          <div key={sec.id} className="text-xs">
                            <span className="font-semibold text-slate-700 block mb-1">■ {sec.name}</span>
                            {sec.subSections.length > 0 && (
                              <ul className="pl-3 border-l-2 border-slate-200 ml-1 space-y-1 mt-1 text-slate-500">
                                {sec.subSections.map(sub => (
                                  <li key={sub.id} className="hover:text-slate-800 transition">
                                    • {sub.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No sections defined.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No departments added to this company yet.
              </div>
            )}
          </div>
        ))}

        {companies.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center text-slate-500 border border-white/70">
            <Building2 size={44} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No companies registered</h3>
            <p className="text-xs text-slate-400">Create a company to establish departments and employee organizational mapping.</p>
          </div>
        )}
      </div>
    </div>
  );
}
