import { createCompany } from '../actions';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Add New Company | HR ERP',
};

export default function NewCompanyPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Corporate Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Company</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register a new company entity or sister concern into the organization
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
        <form action={createCompany} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
              <span>Company Name *</span>
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. Mohammadi Electric Wires & Multi Products Ltd."
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
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. Barishal Factory, Bangladesh"
            />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2"
            >
              <Building2 size={16} />
              <span>Save Company</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
