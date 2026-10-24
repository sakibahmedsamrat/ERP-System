import prisma from '@/lib/prisma';
import { formatDateTime } from '@/lib/formatDate';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Activity Logs | HR ERP',
};

export default async function ActivityLogsPage() {
  const session = await getSession();
  if (!session || !session.user) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Audit Trail &amp; Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Activity Logs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time audit log of system operations, modifications, and administrative events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-200/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
            <ShieldCheck size={14} />
            {logs.length} Recent Records
          </span>
        </div>
      </div>
      
      {/* Glass Table Container */}
      <div className="glass-table-container rounded-3xl shadow-sm border border-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Creator Name</th>
                <th className="p-4">Creator ID</th>
                <th className="p-4">Module</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white/40">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-4 text-slate-500 font-mono">{formatDateTime(log.createdAt)}</td>
                  <td className="p-4 text-slate-900 font-bold">{log.userName}</td>
                  <td className="p-4 text-slate-500 font-mono">{log.userId}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-xs ${
                      log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      log.action === 'DELETE' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 max-w-md truncate" title={log.details || ''}>{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    <Activity size={32} className="mx-auto mb-2 text-slate-300" />
                    No activity logs recorded yet.
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

