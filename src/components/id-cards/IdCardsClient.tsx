'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Contact, UserCheck, ShieldCheck, ArrowLeft, Layers } from 'lucide-react';
import EmployeeIdCardSection from '@/components/id-cards/EmployeeIdCardSection';
import VisitorLogbookSection from '@/components/id-cards/VisitorLogbookSection';
import A4BatchPrintSection from '@/components/id-cards/A4BatchPrintSection';

export default function IdCardsClient({
  initialTab = 'employee',
  searchParams,
  canAccessWorkers = true,
  workers = [],
  visitorLogs = [],
  companies = []
}: {
  initialTab?: 'employee' | 'visitor' | 'batch';
  searchParams?: Record<string, string | undefined>;
  canAccessWorkers?: boolean;
  workers?: any[];
  visitorLogs?: any[];
  companies?: any[];
}) {
  const [activeTab, setActiveTab] = useState<'employee' | 'visitor' | 'batch'>(initialTab);

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full mx-auto space-y-4">
      {/* Page Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <Link
            href={canAccessWorkers ? "/workers" : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mb-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> {canAccessWorkers ? "Back to Employees" : "Back to Dashboard"}
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Contact size={22} />
            </div>
            Smart ID Badges &amp; Visitor System
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate dynamic QR/barcode employee badges, manage factory gate visitors, and print A4 batch sheets
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1.5 glass-card bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass">
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'employee'
                ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            <UserCheck size={16} />
            <span>Employee ID Card</span>
          </button>

          <button
            onClick={() => setActiveTab('visitor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'visitor'
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/20 translate-y-[-1px]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Visitor Management (VMS)</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'batch'
                ? 'bg-white text-emerald-600 shadow-md shadow-emerald-500/20 translate-y-[-1px]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            <Layers size={16} />
            <span>A4 Batch Print (8/Sheet)</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeTab === 'employee' && (
        <EmployeeIdCardSection searchParams={searchParams} />
      )}
      {activeTab === 'visitor' && (
        <VisitorLogbookSection visitorLogs={visitorLogs} workers={workers} />
      )}
      {activeTab === 'batch' && (
        <A4BatchPrintSection workers={workers} companies={companies} />
      )}
    </div>
  );
}
