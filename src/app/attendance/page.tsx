import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ClipboardCheck, Calendar, Filter, Sparkles } from 'lucide-react';

export default async function AttendancePage({ searchParams }: { searchParams: { date?: string } }) {
  const rawDate = searchParams?.date;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const dateStr = safeDate.toISOString().split('T')[0];
  
  const startOfDay = new Date(safeDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(safeDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      worker: {
        isDeleted: false,
      }
    },
    include: {
      worker: {
        select: {
          id: true,
          workerId: true,
          name: true,
          company: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Daily Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log and review daily employee attendance and check-in statuses
          </p>
        </div>
        <Link 
          href="/attendance/mark" 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 w-fit"
        >
          <ClipboardCheck size={18} /> Mark Attendance
        </Link>
      </div>

      {/* Filter Glass Card */}
      <div className="glass-card rounded-2xl shadow-sm border border-white/70 p-4 sm:p-5 flex flex-wrap gap-4 items-end">
        <form className="flex flex-wrap gap-4 items-end w-full">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-blue-600" />
              <span>Select Date</span>
            </label>
            <input 
              type="date" 
              name="date" 
              defaultValue={dateStr}
              className="bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-xs"
            />
          </div>
          <button 
            type="submit" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Filter size={14} /> Filter Date
          </button>
        </form>
      </div>

      {/* Attendance Table */}
      <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white/40">
              {attendances.map((record) => {
                let statusBadge = "bg-slate-100 text-slate-800 border-slate-200";
                if (record.status === "PRESENT") statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
                if (record.status === "ABSENT") statusBadge = "bg-rose-50 text-rose-800 border-rose-200/80";
                if (record.status === "LATE") statusBadge = "bg-amber-50 text-amber-800 border-amber-200/80";
                if (record.status === "LEAVE") statusBadge = "bg-blue-50 text-blue-800 border-blue-200/80";

                return (
                  <tr key={record.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{record.worker?.workerId || '-'}</td>
                    <td className="p-4 font-semibold text-slate-800">{record.worker?.name || '-'}</td>
                    <td className="p-4 text-slate-600">{record.worker?.company?.name || '-'}</td>
                    <td className="p-4">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shadow-xs ${statusBadge}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {attendances.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-500 font-medium">
                    No attendance records logged for {dateStr}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
