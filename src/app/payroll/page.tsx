import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Banknote, CreditCard, FileSpreadsheet, ArrowRight, FileCheck, CheckCircle2, Clock, Users } from 'lucide-react';

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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <Banknote size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payroll Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Process final settlements, service benefits, and generate official 2-page bank salary certificates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/payroll/salary-statement"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 transition-all hover:shadow-lg"
          >
            <FileSpreadsheet size={18} /> Generate Salary Statement
          </Link>
          <Link
            href="/settlements/new"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
          >
            <CreditCard size={18} /> New Settlement
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalActiveWorkers}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Settlements</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalSettlements}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingSettlements}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved Settlements</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedSettlements}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Main Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settlements Module Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <CreditCard size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Settlements</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Complete end-of-service and resignation benefit calculations. Computes service age benefits, remaining leave encashment, attendance adjustments, absent deductions, and generates printable settlement receipts.
            </p>

            <ul className="space-y-2.5 text-xs text-gray-600 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-600" />
                Resignation application & last working day tracking
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-600" />
                Automated Bangladesh Labor Act calculation algorithms
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-600" />
                Approval workflows (Pending, Approved, Paid) & receipts
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link
              href="/payroll/settlements"
              className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition group-hover:translate-x-1"
            >
              Open Settlements <ArrowRight size={16} />
            </Link>
            <Link
              href="/settlements/new"
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition"
            >
              + Create New
            </Link>
          </div>
        </div>

        {/* Salary Statement Module Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Salary Statement</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Generate official 2-page salary statement certificates for bank loan applications, visa processing, or employment verifications. Includes past 3 months gross salary breakdown and monthly salary certificate with PDF export.
            </p>

            <ul className="space-y-2.5 text-xs text-gray-600 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600" />
                Page 1: Past 3 months gross salary breakdown table
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600" />
                Page 2: Monthly Salary Certificate & Bank Details
              </li>
              <li className="flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600" />
                Direct 2-Page PDF Download & High-Fidelity Print
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link
              href="/payroll/salary-statement"
              className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm hover:text-emerald-800 transition group-hover:translate-x-1"
            >
              Generate Statement <ArrowRight size={16} />
            </Link>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold">
              2-Page PDF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
