'use client'

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Contact, UserCheck, ShieldCheck } from 'lucide-react';
import EmployeeIdCardSection from '@/components/id-cards/EmployeeIdCardSection';
import VisitorIdCardSection from '@/components/id-cards/VisitorIdCardSection';

function IdCardsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'visitor' ? 'visitor' : 'employee';
  const [activeTab, setActiveTab] = useState<'employee' | 'visitor'>(initialTab);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Contact size={22} />
            </div>
            ID Card Generator
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and print official MEP Group Employee &amp; Visitor ID Cards
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1.5 bg-gray-200/70 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'employee'
                ? 'bg-white text-blue-600 shadow-md shadow-gray-200 translate-y-[-1px]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck size={18} />
            <span>Employee ID Card</span>
          </button>

          <button
            onClick={() => setActiveTab('visitor')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'visitor'
                ? 'bg-white text-indigo-600 shadow-md shadow-gray-200 translate-y-[-1px]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck size={18} />
            <span>Visitor ID Card</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeTab === 'employee' ? (
        <EmployeeIdCardSection />
      ) : (
        <VisitorIdCardSection />
      )}
    </div>
  );
}

export default function IdCardsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading ID Card Generator...</div>}>
      <IdCardsContent />
    </Suspense>
  );
}
