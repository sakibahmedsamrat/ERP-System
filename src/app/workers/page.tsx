import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus, User, Building2, Trash2, Search, Download, Upload, Hash, Briefcase, Layers, Network, FolderTree, X } from 'lucide-react';
import { deleteWorker } from './actions';
import { getSession } from '@/lib/auth';
import DeleteWorkerButton from '@/components/DeleteWorkerButton';

const prisma = new PrismaClient();

export default async function WorkersPage({ searchParams }: { searchParams: { workerId?: string; name?: string; designation?: string; department?: string; section?: string; subSection?: string; company?: string; } }) {
  const session = await getSession();
  const role = session?.user?.role;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const { workerId, name, designation, department, section, subSection, company } = searchParams;

  const whereClause: any = { AND: [] };

  if (workerId) whereClause.AND.push({ workerId: { contains: workerId, mode: 'insensitive' } });
  if (name) whereClause.AND.push({ name: { contains: name, mode: 'insensitive' } });
  if (designation) whereClause.AND.push({ designation: { contains: designation, mode: 'insensitive' } });
  if (department) whereClause.AND.push({ department: { name: { contains: department, mode: 'insensitive' } } });
  if (section) whereClause.AND.push({ section: { name: { contains: section, mode: 'insensitive' } } });
  if (subSection) whereClause.AND.push({ subSection: { name: { contains: subSection, mode: 'insensitive' } } });
  if (company) whereClause.AND.push({ company: { name: { contains: company, mode: 'insensitive' } } });

  const queryOptions: any = {
    orderBy: { createdAt: 'desc' },
    include: { company: true, department: true, section: true, subSection: true }
  };
  
  if (whereClause.AND.length > 0) {
    queryOptions.where = whereClause;
  }

  const [workers, companies, departments, sections, subSections, designations] = await Promise.all([
    prisma.worker.findMany(queryOptions),
    prisma.company.findMany({ select: { name: true }, distinct: ['name'] }),
    prisma.department.findMany({ select: { name: true }, distinct: ['name'] }),
    prisma.section.findMany({ select: { name: true }, distinct: ['name'] }),
    prisma.subSection.findMany({ select: { name: true }, distinct: ['name'] }),
    prisma.worker.findMany({ where: { designation: { not: null } }, distinct: ['designation'], select: { designation: true } })
  ]);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Link href="/api/workers/export" className="bg-green-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition text-sm">
                <Download size={16} /> Export CSV
              </Link>
              <Link href="/workers/import" className="bg-purple-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-purple-700 transition text-sm">
                <Upload size={16} /> Import CSV
              </Link>
            </>
          )}
          <Link href="/workers/new" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition text-sm">
            <Plus size={16} /> Add Employee
          </Link>
        </div>
      </div>

      {/* Autocomplete Data Lists */}
      <datalist id="company-list">
        {companies.map((c: any) => <option key={c.name} value={c.name} />)}
      </datalist>
      <datalist id="department-list">
        {departments.map((d: any) => <option key={d.name} value={d.name} />)}
      </datalist>
      <datalist id="section-list">
        {sections.map((s: any) => <option key={s.name} value={s.name} />)}
      </datalist>
      <datalist id="subsection-list">
        {subSections.map((s: any) => <option key={s.name} value={s.name} />)}
      </datalist>
      <datalist id="designation-list">
        {designations.map((d: any) => <option key={d.designation} value={d.designation} />)}
      </datalist>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-5">
        <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
          <Search size={18} className="text-blue-600" />
          <h2>Filter Employees</h2>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 w-full text-sm">
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Hash size={14} />
            </div>
            <input type="text" name="workerId" defaultValue={workerId} placeholder="ID..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <User size={14} />
            </div>
            <input type="text" name="name" defaultValue={name} placeholder="Name..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Building2 size={14} />
            </div>
            <input type="text" name="company" list="company-list" defaultValue={company} placeholder="Company..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Briefcase size={14} />
            </div>
            <input type="text" name="designation" list="designation-list" defaultValue={designation} placeholder="Designation..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Layers size={14} />
            </div>
            <input type="text" name="department" list="department-list" defaultValue={department} placeholder="Department..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Network size={14} />
            </div>
            <input type="text" name="section" list="section-list" defaultValue={section} placeholder="Section..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <FolderTree size={14} />
            </div>
            <input type="text" name="subSection" list="subsection-list" defaultValue={subSection} placeholder="Sub-Section..." className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white" />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-7 flex justify-end gap-3 mt-2">
            <Link href="/workers" className="flex items-center gap-1.5 px-5 py-2 text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-900 rounded-lg border border-gray-200 transition-all shadow-sm">
              <X size={14} /> Clear
            </Link>
            <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-all flex items-center gap-2 shadow-sm font-medium">
              <Search size={16} /> Filter Results
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium text-gray-600">ID</th>
              <th className="p-4 font-medium text-gray-600">Name</th>
              <th className="p-4 font-medium text-gray-600">Company</th>
              <th className="p-4 font-medium text-gray-600">Dept</th>
              <th className="p-4 font-medium text-gray-600">Section</th>
              <th className="p-4 font-medium text-gray-600">Sub-Section</th>
              <th className="p-4 font-medium text-gray-600">Designation</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workers.map((worker: any) => (
              <tr key={worker.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-900">{worker.workerId}</td>
                <td className="p-4 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {worker.name}
                </td>
                <td className="p-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    {worker.company?.name || '-'}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{worker.department?.name || '-'}</td>
                <td className="p-4 text-gray-600">{worker.section?.name || '-'}</td>
                <td className="p-4 text-gray-600">{worker.subSection?.name || '-'}</td>
                <td className="p-4 text-gray-600">{worker.designation || '-'}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <Link 
                    href={`/workers/${worker.id}/id-card`} 
                    className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded transition"
                    target="_blank"
                  >
                    ID Card
                  </Link>
                  <Link 
                    href={`/workers/${worker.id}/edit`} 
                    className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded transition"
                  >
                    Edit
                  </Link>
                  <DeleteWorkerButton id={worker.id} onDelete={deleteWorker} />
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No workers found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}





