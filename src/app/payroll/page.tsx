import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Banknote, CreditCard, FileSpreadsheet, ArrowRight, FileCheck, CheckCircle2, Clock, Users, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Payroll Management | HR ERP',
};

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  const hasModule = (modName: string) => {
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.modules === '*') return true;
    const mods = (user.modules || '').split(',').map((m: string) => m.trim());
    return mods.includes(modName);
  };

  if (!hasModule('PAYROLL') && !hasModule('SETTLEMENTS')) {
    redirect('/');
  }

  const [totalSettlements, pendingSettlements, approvedSettlements, totalActiveWorkers] = await Promise.all([
    prisma.settlement.count(),
    prisma.settlement.count({
      where: {
        status: 'PENDING'
      }
    }),
    prisma.settlement.count({
      where: {
        status: { in: ['APPROVED', 'PAID'] }
      }
    }),
    prisma.worker.count({
      where: {
        isDeleted: false,
        isActive: true
      }
    })
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <Banknote size={32} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles size={13} />
              <span>Compensation & Benefits</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payroll Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Process final settlements, service benefits, and generate official 2-page bank salary certificates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/payroll/salary-statement"
            prefetch={true}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all hover:shadow-lg"
          >
            <FileSpreadsheet size={17} /> Generate Salary Statement
          </Link>
          <Link
            href="/settlements/new"
            prefetch={true}
            className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-xs"
          >
            <CreditCard size={17} /> New Settlement
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card glass-card-hover p-5 rounded-3xl border border-white/70 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Employees</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalActiveWorkers}</p>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-600 border border-blue-200/50 rounded-2xl group-hover:scale-105 transition-transform">
            <Users size={22} />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-3xl border border-white/70 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Settlements</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalSettlements}</p>
          </div>
          <div className="p-3.5 bg-indigo-500/10 text-indigo-600 border border-indigo-200/50 rounded-2xl group-hover:scale-105 transition-transform">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-3xl border border-white/70 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Approvals</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{pendingSettlements}</p>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-600 border border-amber-200/50 rounded-2xl group-hover:scale-105 transition-transform">
            <Clock size={22} />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-3xl border border-white/70 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Approved Settlements</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{approvedSettlements}</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 rounded-2xl group-hover:scale-105 transition-transform">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Main Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Settlements Module Card */}
        <div className="glass-card glass-card-hover rounded-3xl border border-white/70 p-8 shadow-sm flex flex-col justify-between group relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <CreditCard size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Settlements</h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
              Complete end-of-service and resignation benefit calculations. Computes service age benefits, remaining leave encashment, attendance adjustments, absent deductions, and generates printable settlement receipts.
            </p>

            <ul className="space-y-3 text-xs text-slate-600 mb-6 font-semibold">
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-600 shrink-0" />
                <span>Resignation application &amp; last working day tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-600 shrink-0" />
                <span>Automated Bangladesh Labor Act calculation algorithms</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-600 shrink-0" />
                <span>Approval workflows (Pending, Approved, Paid) &amp; receipts</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between relative z-10">
            <Link
              href="/payroll/settlements"
              prefetch={true}
              className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition group-hover:translate-x-1"
            >
              <span>Open Settlements</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/settlements/new"
              prefetch={true}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition border border-indigo-100 shadow-xs"
            >
              + Create New
            </Link>
          </div>
        </div>

        {/* Salary Statement Module Card */}
        <div className="glass-card glass-card-hover rounded-3xl border border-white/70 p-8 shadow-sm flex flex-col justify-between group relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Salary Statement</h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
              Generate official 2-page salary statement certificates for bank loan applications, visa processing, or employment verifications. Includes past 3 months gross salary breakdown and monthly salary certificate with PDF export.
            </p>

            <ul className="space-y-3 text-xs text-slate-600 mb-6 font-semibold">
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Page 1: Past 3 months gross salary breakdown table</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Page 2: Monthly Salary Certificate &amp; Bank Details</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Direct 2-Page PDF Download &amp; High-Fidelity Print</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between relative z-10">
            <Link
              href="/payroll/salary-statement"
              prefetch={true}
              className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm hover:text-emerald-800 transition group-hover:translate-x-1"
            >
              <span>Generate Statement</span>
              <ArrowRight size={16} />
            </Link>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-bold border border-emerald-100 shadow-xs">
              2-Page PDF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
