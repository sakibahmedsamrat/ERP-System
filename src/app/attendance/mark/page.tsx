import prisma from '@/lib/prisma';
import { markAttendance } from '../actions';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, ClipboardCheck, Sparkles, User, Users } from 'lucide-react';

export const metadata = {
  title: 'Mark Attendance | HR ERP',
};

export default async function MarkAttendancePage({ searchParams }: { searchParams: { companyId?: string } }) {
  const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
  
  const selectedCompanyId = searchParams.companyId || '';
  
  let workers: any[] = [];
  if (selectedCompanyId) {
    workers = await prisma.worker.findMany({
      where: { 
        companyId: selectedCompanyId,
        isActive: true,
        isDeleted: false
      },
      select: {
        id: true,
        workerId: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Attendance Roster</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mark Attendance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select an operating company, review the active workforce, and record daily status logs
          </p>
        </div>
        <Link 
          href="/attendance" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Log
        </Link>
      </div>

      {/* Company Selection Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/70 shadow-sm">
        <form className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
              <span>Select Company *</span>
            </label>
            <select 
              name="companyId" 
              defaultValue={selectedCompanyId}
              required
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-800"
            >
              <option value="">-- Choose Company --</option>
              {companies.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            <Users size={16} />
            <span>Load Workers</span>
          </button>
        </form>
      </div>

      {/* Attendance Form */}
      {selectedCompanyId && workers.length > 0 && (
        <div className="glass-table-container rounded-3xl shadow-sm border border-white/70 overflow-hidden">
          <form action={markAttendance}>
            <input type="hidden" name="companyId" value={selectedCompanyId} />
            
            <div className="p-4 sm:p-5 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-200/50">
                  <Calendar size={18} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Attendance Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={today}
                    required
                    className="border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500 bg-white/70 px-3 py-1.5 rounded-full border border-slate-200/60">
                {workers.length} Total Workers
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 bg-white/40">
                  {workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{worker.workerId}</td>
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span>{worker.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3 sm:gap-6">
                          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-emerald-50/60 transition">
                            <input type="radio" name={`status_${worker.id}`} value="PRESENT" defaultChecked className="text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-emerald-700 font-bold text-xs">Present</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition">
                            <input type="radio" name={`status_${worker.id}`} value="ABSENT" className="text-rose-600 focus:ring-rose-500" />
                            <span className="text-rose-700 font-bold text-xs">Absent</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-amber-50/60 transition">
                            <input type="radio" name={`status_${worker.id}`} value="LATE" className="text-amber-600 focus:ring-amber-500" />
                            <span className="text-amber-700 font-bold text-xs">Late</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50/60 transition">
                            <input type="radio" name={`status_${worker.id}`} value="LEAVE" className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-blue-700 font-bold text-xs">Leave</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-slate-50/80 backdrop-blur-md border-t border-slate-200/70 flex justify-end">
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                <ClipboardCheck size={18} />
                <span>Submit Attendance</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCompanyId && workers.length === 0 && (
        <div className="glass-card p-12 text-center rounded-3xl shadow-sm border border-white/70 text-slate-500">
          <Users size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-800">No active workers found</p>
          <p className="text-xs text-slate-400 mt-1">There are no active employees assigned to this company.</p>
        </div>
      )}
    </div>
  );
}
