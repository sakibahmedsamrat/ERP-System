import prisma from '@/lib/prisma';
import Link from 'next/link';
import { formatDateTime } from '@/lib/formatDate';
import { Plus, MapPin, Calendar, Eye, Edit, Users, Sparkles, GraduationCap } from 'lucide-react';
import DeleteTrainingButton from './DeleteTrainingButton';

export default async function TrainingPage() {
  const [trainings, totalWorkers] = await Promise.all([
    prisma.training.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    }),
    prisma.worker.count({ where: { isDeleted: false } })
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Skill Development</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Training Schedules</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Plan, assign, and record employee training and development programs
          </p>
        </div>
        <Link 
          href="/training/new" 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 w-fit"
        >
          <Plus size={18} /> Schedule Training
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings.map((training) => (
          <div 
            key={training.id} 
            className="glass-card glass-card-hover rounded-3xl border border-white/70 shadow-sm flex flex-col overflow-hidden group"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-slate-900 pr-16 group-hover:text-blue-600 transition-colors">
                  {training.title}
                </h2>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border shadow-xs ${
                  training.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  training.status === 'CANCELLED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                  'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {training.status}
                </span>
              </div>
              <p className="text-slate-600 text-xs mb-4 line-clamp-2 flex-1 leading-relaxed">
                {training.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 mb-4 bg-white/70 backdrop-blur-sm border border-slate-200/60 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-blue-600" />
                  <span>{training._count.workers} / {totalWorkers} Participants</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" /> {formatDateTime(training.date)}
                </span>
                {training.location && (
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" /> {training.location}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200/60 p-4 bg-white/40 backdrop-blur-xs rounded-b-3xl flex justify-between items-center">
              <Link 
                href={`/training/${training.id}`}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs transition"
              >
                <Eye size={15} /> View Details
              </Link>
              
              <div className="flex items-center gap-3">
                <Link 
                  href={`/training/${training.id}/edit`}
                  className="text-slate-400 hover:text-orange-500 transition p-1 rounded-lg hover:bg-white/80"
                  title="Edit Training"
                >
                  <Edit size={16} />
                </Link>
                <DeleteTrainingButton id={training.id} />
              </div>
            </div>
          </div>
        ))}

        {trainings.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center rounded-3xl shadow-sm border border-white/70 flex flex-col items-center">
            <GraduationCap size={44} className="text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Training Scheduled</h3>
            <p className="text-xs text-slate-400 mb-6">Create your first training schedule to assign employees.</p>
            <Link 
              href="/training/new" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-blue-600/20"
            >
              Schedule Training
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
