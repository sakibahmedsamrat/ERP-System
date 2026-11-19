import prisma, { withDbTimeout } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Plus, User, Building2, Trash2, Search, Download, Upload, Hash, 
  Briefcase, Layers, Network, FolderTree, X, ChevronLeft, ChevronRight, 
  UserCheck, Contact, AlertCircle, RotateCcw 
} from 'lucide-react';
import { deleteWorker } from './actions';
import { getSession } from '@/lib/auth';
import DeleteWorkerButton from '@/components/DeleteWorkerButton';
import BulkDeleteWorkersModal from '@/components/BulkDeleteWorkersModal';
import ReconnectButton from '@/components/ReconnectButton';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Employees | HR ERP',
};

const emptyFilterOptions = {
  companies: [] as { name: string }[],
  departments: [] as { name: string }[],
  sections: [] as { name: string }[],
  subSections: [] as { name: string }[],
  designations: [] as { designation: string | null }[],
};

const getWorkerFilterOptions = unstable_cache(
  async () => {
    const [companies, departments, sections, subSections, designations] = await withDbTimeout(
      Promise.all([
        prisma.company.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } }),
        prisma.department.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } }),
        prisma.section.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } }),
        prisma.subSection.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } }),
        prisma.worker.findMany({
          where: { isDeleted: false, designation: { not: null } },
          distinct: ['designation'],
          select: { designation: true },
          take: 100,
          orderBy: { designation: 'asc' }
        }),
      ]),
      6000
    );
    return { companies, departments, sections, subSections, designations };
  },
  ['worker-filter-options'],
  { revalidate: 120, tags: ['filter-options', 'workers'] }
);

export default async function WorkersPage({ 
  searchParams 
}: { 
  searchParams?: { 
    workerId?: string | string[]; 
    name?: string | string[]; 
    designation?: string | string[]; 
    department?: string | string[]; 
    section?: string | string[]; 
    subSection?: string | string[]; 
    company?: string | string[]; 
    page?: string | string[];
  } 
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = session?.user;
  const role = user?.role;
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const hasModule = (modName: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  // If user does not have permission for the full workers directory, redirect to allowed submodule or home
  if (!hasModule('WORKERS')) {
    if (hasModule('CONFIRMATIONS')) {
      redirect('/confirmations');
    } else if (hasModule('IDCARD')) {
      redirect('/id-cards');
    } else {
      redirect('/');
    }
  }

  const cleanParam = (val: string | string[] | undefined): string | undefined => {
    if (Array.isArray(val)) return val[0]?.trim() || undefined;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  };

  const params = searchParams || {};
  const workerId = cleanParam(params.workerId);
  const name = cleanParam(params.name);
  const designation = cleanParam(params.designation);
  const department = cleanParam(params.department);
  const section = cleanParam(params.section);
  const subSection = cleanParam(params.subSection);
  const company = cleanParam(params.company);

  const rawPage = cleanParam(params.page);
  const page = Math.max(1, parseInt(rawPage || '1', 10) || 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const whereClause: any = { AND: [{ isDeleted: false }] };

  if (workerId) whereClause.AND.push({ workerId: { contains: workerId, mode: 'insensitive' } });
  if (name) whereClause.AND.push({ name: { contains: name, mode: 'insensitive' } });
  if (designation) whereClause.AND.push({ designation: { contains: designation, mode: 'insensitive' } });
  if (department) whereClause.AND.push({ department: { name: { contains: department, mode: 'insensitive' } } });
  if (section) whereClause.AND.push({ section: { name: { contains: section, mode: 'insensitive' } } });
  if (subSection) whereClause.AND.push({ subSection: { name: { contains: subSection, mode: 'insensitive' } } });
  if (company) whereClause.AND.push({ company: { name: { contains: company, mode: 'insensitive' } } });

  const queryOptions: any = {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      workerId: true,
      name: true,
      designation: true,
      company: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subSection: { select: { id: true, name: true } }
    },
    where: whereClause
  };

  let filterOptions = emptyFilterOptions;
  let workers: any[] = [];
  let totalWorkers = 0;
  let deletedWorkersCount = 0;
  let queryError: string | null = null;

  try {
    const [filterDataResult, workersResult, countResult, deletedCountResult] = await Promise.allSettled([
      getWorkerFilterOptions(),
      withDbTimeout(
        prisma.worker.findMany({
          ...queryOptions,
          skip,
          take: pageSize
        }),
        10000
      ),
      withDbTimeout(
        prisma.worker.count({ where: queryOptions.where }),
        10000
      ),
      role === 'SUPER_ADMIN'
        ? withDbTimeout(prisma.worker.count({ where: { isDeleted: true } }), 8000)
        : Promise.resolve(0)
    ]);

    // Handle filter options
    if (filterDataResult.status === 'fulfilled' && filterDataResult.value) {
      filterOptions = filterDataResult.value;
    } else {
      filterOptions = emptyFilterOptions;
      if (filterDataResult.status === 'rejected') {
        console.warn('[WorkersPage] Filter options load issue:', filterDataResult.reason?.message || filterDataResult.reason);
      }
    }

    // Handle workers list
    if (workersResult.status === 'fulfilled') {
      workers = workersResult.value || [];
    } else {
      console.error('[WorkersPage] Workers query failed:', workersResult.reason);
      queryError = workersResult.reason?.message || 'Database query timed out or failed';
    }

    // Handle worker total count
    if (countResult.status === 'fulfilled') {
      totalWorkers = countResult.value || 0;
    } else {
      console.warn('[WorkersPage] Worker count query failed:', countResult.reason);
      if (workers.length > 0) {
        totalWorkers = skip + workers.length;
      } else {
        totalWorkers = 0;
        if (!queryError) {
          queryError = countResult.reason?.message || 'Database count timed out or failed';
        }
      }
    }

    // Handle recycle bin deleted count
    if (deletedCountResult.status === 'fulfilled') {
      deletedWorkersCount = deletedCountResult.value || 0;
    } else {
      deletedWorkersCount = 0;
    }
  } catch (error: any) {
    console.error('[WorkersPage] Unexpected error executing queries:', error);
    queryError = error?.message || 'Database query error';
  }

  const { companies, departments, sections, subSections, designations } = filterOptions;

  const totalPages = Math.max(1, Math.ceil(totalWorkers / pageSize));

  const createPageURL = (newPage: number) => {
    const p = new URLSearchParams();
    if (workerId) p.set('workerId', workerId);
    if (name) p.set('name', name);
    if (company) p.set('company', company);
    if (designation) p.set('designation', designation);
    if (department) p.set('department', department);
    if (section) p.set('section', section);
    if (subSection) p.set('subSection', subSection);
    p.set('page', newPage.toString());
    return `/workers?${p.toString()}`;
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Employees</h1>
            {queryError ? (
              <span className="text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-200/60 px-3 py-1 rounded-full shadow-xs">
                — Total Active
              </span>
            ) : (
              <span className="text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-200/60 px-3 py-1 rounded-full shadow-xs">
                {totalWorkers} Total Active
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Central employee registry, department alignments, and profile operations
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {hasModule('CONFIRMATIONS') && (
            <Link 
              href="/confirmations" 
              prefetch={true}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition text-xs font-bold shadow-sm shadow-indigo-600/20 flex-1 sm:flex-initial"
              title="Employee Confirmation"
            >
              <UserCheck size={15} /> Confirmation
            </Link>
          )}
          {hasModule('IDCARD') && (
            <Link 
              href="/id-cards" 
              prefetch={true}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition text-xs font-bold shadow-sm shadow-teal-600/20 flex-1 sm:flex-initial"
              title="ID Card"
            >
              <Contact size={15} /> ID Card
            </Link>
          )}
          {isAdmin && (
            <>
              <Link 
                href="/api/workers/export" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition text-xs font-bold shadow-sm shadow-emerald-600/20 flex-1 sm:flex-initial"
              >
                <Download size={15} /> Export CSV
              </Link>
              <Link 
                href="/workers/import" 
                prefetch={true}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition text-xs font-bold shadow-sm shadow-purple-600/20 flex-1 sm:flex-initial"
              >
                <Upload size={15} /> Import CSV
              </Link>
              <BulkDeleteWorkersModal />
            </>
          )}
          {role === 'SUPER_ADMIN' && (
            <Link 
              href="/workers/recycle-bin" 
              prefetch={true}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition text-xs font-bold shadow-sm shadow-rose-600/20 flex-1 sm:flex-initial"
              title="Employee Recycle Bin"
            >
              <Trash2 size={15} /> Recycle Bin
              {deletedWorkersCount > 0 && (
                <span className="bg-white/25 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {deletedWorkersCount}
                </span>
              )}
            </Link>
          )}
          {hasModule('WORKERS') && (
            <Link 
              href="/workers/new" 
              prefetch={true}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition text-xs font-bold shadow-md shadow-blue-600/20 flex-1 sm:flex-initial"
            >
              <Plus size={16} /> Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* Temporary disruption banner */}
      {queryError && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs animate-fade-in text-amber-900">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <AlertCircle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-sm">Temporary Network or Database Disruption</h3>
              <ReconnectButton
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                label="Reconnect"
                iconSize={13}
              />
            </div>
            <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
              We encountered a delay communicating with the database. You can retry reconnecting, or try again shortly.
            </p>
          </div>
        </div>
      )}

      {/* Autocomplete Data Lists */}
      <datalist id="company-list">
        {(companies || []).map((c: any) => <option key={c.name} value={c.name} />)}
      </datalist>
      <datalist id="department-list">
        {(departments || []).map((d: any) => <option key={d.name} value={d.name} />)}
      </datalist>
      <datalist id="section-list">
        {(sections || []).map((s: any) => <option key={s.name} value={s.name} />)}
      </datalist>
      <datalist id="subsection-list">
        {(subSections || []).map((s: any) => <option key={s.name} value={s.name} />)}
      </datalist>
      <datalist id="designation-list">
        {(designations || []).filter((d: any) => Boolean(d?.designation)).map((d: any) => <option key={d.designation} value={d.designation} />)}
      </datalist>

      {/* Filter Glass Card */}
      <div className="glass-card rounded-2xl p-5 shadow-sm border border-white/70">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm">
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600">
            <Search size={15} />
          </div>
          <h2>Filter Employees</h2>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 w-full text-xs">
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Hash size={13} />
            </div>
            <input 
              type="text" 
              name="workerId" 
              defaultValue={workerId} 
              placeholder="Employee ID..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User size={13} />
            </div>
            <input 
              type="text" 
              name="name" 
              defaultValue={name} 
              placeholder="Name..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 size={13} />
            </div>
            <input 
              type="text" 
              name="company" 
              list="company-list" 
              defaultValue={company} 
              placeholder="Company..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Briefcase size={13} />
            </div>
            <input 
              type="text" 
              name="designation" 
              list="designation-list" 
              defaultValue={designation} 
              placeholder="Designation..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Layers size={13} />
            </div>
            <input 
              type="text" 
              name="department" 
              list="department-list" 
              defaultValue={department} 
              placeholder="Department..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Network size={13} />
            </div>
            <input 
              type="text" 
              name="section" 
              list="section-list" 
              defaultValue={section} 
              placeholder="Section..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <FolderTree size={13} />
            </div>
            <input 
              type="text" 
              name="subSection" 
              list="subsection-list" 
              defaultValue={subSection} 
              placeholder="Sub-Section..." 
              className="w-full pl-8 pr-3 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-900" 
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-7 flex flex-col sm:flex-row justify-end gap-2.5 mt-2 w-full">
            <Link 
              href="/workers" 
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-600 bg-white/80 hover:bg-white hover:text-slate-900 border border-slate-200/80 transition shadow-xs text-xs font-semibold min-h-[44px] w-full sm:w-auto"
            >
              <X size={13} /> Clear
            </Link>
            <button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-xs font-bold min-h-[44px] w-full sm:w-auto"
            >
              <Search size={14} /> Filter Results
            </button>
          </div>
        </form>
      </div>

      {/* Table Glass Container */}
      <div className="glass-table-container rounded-2xl overflow-hidden shadow-sm border border-white/70">
        <div className="overflow-x-auto custom-scrollbar touch-scroll">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Company</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Section</th>
                <th className="p-3.5">Sub-Section</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white/40">
              {workers.map((worker: any) => (
                <tr key={worker.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{worker.workerId}</td>
                  <td className="p-3.5 font-medium text-slate-800">
                    <Link
                      href={`/workers/${worker.id}`}
                      prefetch={true}
                      className="flex items-center gap-2 hover:text-blue-600 font-bold transition-colors group"
                    >
                      <User size={14} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="group-hover:underline">{worker.name}</span>
                    </Link>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 text-[11px] font-semibold">
                      {worker.company?.name || '-'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{worker.department?.name || '-'}</td>
                  <td className="p-3.5 text-slate-600">{worker.section?.name || '-'}</td>
                  <td className="p-3.5 text-slate-600">{worker.subSection?.name || '-'}</td>
                  <td className="p-3.5 text-slate-600 font-medium">{worker.designation || '-'}</td>
                  <td className="p-3.5 text-right flex justify-end items-center gap-2">
                    <Link 
                      href={`/workers/${worker.id}`} 
                      prefetch={true}
                      className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition font-semibold"
                    >
                      360° Profile
                    </Link>
                    <Link 
                      href={`/workers/${worker.id}/edit`} 
                      prefetch={true}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-100 transition font-semibold"
                    >
                      Edit
                    </Link>
                    <DeleteWorkerButton id={worker.id} onDelete={deleteWorker} />
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    {queryError ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-4">
                        <AlertCircle size={28} className="text-amber-500 mb-1" />
                        <span className="font-semibold text-slate-700 text-sm">Unable to load employee records</span>
                        <span className="text-xs text-slate-500 max-w-sm">
                          Database connection timed out or encountered a network disruption.
                        </span>
                        <ReconnectButton
                          className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          label="Reconnect Now"
                          iconSize={13}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        No employees found matching your criteria.
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="glass-panel p-4 rounded-2xl border border-white/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Showing <span className="font-bold text-slate-800">{totalWorkers === 0 ? 0 : skip + 1}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min(skip + pageSize, totalWorkers)}</span> of{' '}
            <span className="font-bold text-slate-800">{totalWorkers}</span> employees
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs w-full sm:w-auto">
            {page > 1 ? (
              <Link
                href={createPageURL(page - 1)}
                className="flex-1 sm:flex-initial justify-center min-h-[44px] px-3.5 py-2 border border-slate-200/80 rounded-xl text-slate-700 hover:bg-white flex items-center gap-1 transition font-semibold bg-white/70 shadow-xs"
              >
                <ChevronLeft size={14} /> Previous
              </Link>
            ) : (
              <span className="flex-1 sm:flex-initial justify-center min-h-[44px] px-3.5 py-2 border border-slate-100 rounded-xl text-slate-300 flex items-center gap-1 cursor-not-allowed">
                <ChevronLeft size={14} /> Previous
              </span>
            )}

            <div className="font-bold px-3 text-slate-700 whitespace-nowrap">
              Page {page} of {totalPages}
            </div>

            {page < totalPages ? (
              <Link
                href={createPageURL(page + 1)}
                className="flex-1 sm:flex-initial justify-center min-h-[44px] px-3.5 py-2 border border-slate-200/80 rounded-xl text-slate-700 hover:bg-white flex items-center gap-1 transition font-semibold bg-white/70 shadow-xs"
              >
                Next <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="flex-1 sm:flex-initial justify-center min-h-[44px] px-3.5 py-2 border border-slate-100 rounded-xl text-slate-300 flex items-center gap-1 cursor-not-allowed">
                Next <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
