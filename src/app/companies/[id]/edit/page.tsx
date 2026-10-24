import prisma from '@/lib/prisma';
import Link from 'next/link';
import { updateCompany } from '../../actions';
import { getSession } from '@/lib/auth';
import { ArrowLeft, Building2, MapPin, Sparkles, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Edit Company | HR ERP',
};

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl p-8 border border-rose-200 bg-rose-50/80 text-center">
          <ShieldAlert size={36} className="mx-auto text-rose-600 mb-2" />
          <h2 className="text-base font-bold text-rose-900">Access Denied</h2>
          <p className="text-xs text-rose-700 mt-1">Only Super Administrators can edit corporate company entities.</p>
        </div>
      </div>
    );
  }
  const company = await prisma.company.findUnique({ where: { id: params.id } });

  if (!company) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl p-8 border border-white/70 text-center text-slate-500">
          <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-800">Company Not Found</p>
        </div>
      </div>
    );
  }

  const updateAction = updateCompany.bind(null, company.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Corporate Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Company</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update company entity information and physical plant location
          </p>
        </div>
        <Link 
          href="/companies" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Companies
        </Link>
      </div>

      {/* Glass Card Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm">
        <form action={updateAction} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
              <span>Company Name *</span>
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              defaultValue={company.name}
              required 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" />
              <span>Location / Address</span>
            </label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              defaultValue={company.location || ''}
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2"
            >
              <Building2 size={16} />
              <span>Update Company</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

