import prisma from '@/lib/prisma';
import Link from 'next/link';
import { formatDateTime } from '@/lib/formatDate';
import { notFound } from 'next/navigation';
import { Users, Calendar, MapPin, CheckCircle, Clock, User, ArrowLeft, Pencil, Sparkles, GraduationCap } from 'lucide-react';

export default async function TrainingDetailsPage({ params }: { params: { id: string } }) {
  const [training, totalWorkers] = await Promise.all([
    prisma.training.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        status: true,
        trainer: { select: { id: true, name: true } },
        workers: {
          select: {
            id: true,
            workerId: true,
            name: true,
            designation: true,
            department: { select: { name: true } }
          }
        }
      }
    }),
    prisma.worker.count({ where: { isDeleted: false } })
  ]);

  if (!training) notFound();
  const participantCount = training.workers.length;
  const percentage = totalWorkers > 0 ? Math.round((participantCount / totalWorkers) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Training Overview</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{training.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review training schedule, trainer assignment, and participating workforce records
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link 
            href="/training" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
          >
            <ArrowLeft size={16} /> Back to Training
          </Link>
          <Link
            href={`/training/${training.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition text-xs font-bold shadow-md shadow-blue-600/20"
          >
            <Pencil size={15} /> Edit Session
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Details Glass Card */}
        <div className="md:col-span-2 glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm space-y-5">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Curriculum &amp; Objectives</span>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {training.description || 'No description provided for this training program.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 border border-slate-200/70">
              <Calendar className="text-blue-600 shrink-0" size={17} />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Date &amp; Time</span>
                <span className="font-bold text-slate-900">{formatDateTime(training.date)}</span>
              </div>
            </div>

            {training.trainer && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 border border-slate-200/70">
                <User className="text-blue-600 shrink-0" size={17} />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Instructor / Trainer</span>
                  <span className="font-bold text-slate-900">{training.trainer.name}</span>
                </div>
              </div>
            )}

            {training.location && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 border border-slate-200/70">
                <MapPin className="text-blue-600 shrink-0" size={17} />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                  <span className="font-bold text-slate-900">{training.location}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 border border-slate-200/70">
              {training.status === 'COMPLETED' ? (
                <CheckCircle className="text-emerald-600 shrink-0" size={17} />
              ) : (
                <Clock className="text-amber-600 shrink-0" size={17} />
              )}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <span className={`font-bold ${training.status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {training.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Luminous Stat Glass Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-3xl shadow-xl shadow-indigo-900/10 p-7 flex flex-col justify-center items-center text-center relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <Users size={40} className="mb-3 text-blue-200" />
          <div className="text-4xl font-extrabold mb-1 tracking-tight">
            {participantCount} <span className="text-xl text-blue-200 font-semibold">/ {totalWorkers}</span>
          </div>
          <div className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-4">Enrolled Employees</div>
          
          <div className="w-full bg-blue-950/40 rounded-full h-2.5 mb-2 overflow-hidden border border-white/20">
            <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="text-[11px] font-semibold text-blue-200">{percentage}% of total active workforce</div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="glass-table-container rounded-3xl shadow-sm border border-white/70 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-600" />
            <span>Participant Roster ({participantCount})</span>
          </h3>
        </div>
        
        {participantCount === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No employees enrolled</p>
            <p className="text-xs text-slate-400 mt-1">Assign employees in the edit form to populate this participant roster.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Card No</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 bg-white/40">
                {training.workers.map((worker: any) => (
                  <tr key={worker.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span>{worker.name}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{worker.workerId}</td>
                    <td className="p-4 text-slate-700">{worker.designation || '-'}</td>
                    <td className="p-4 text-slate-700">{worker.department?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



