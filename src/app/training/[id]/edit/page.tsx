import prisma from '@/lib/prisma';
import { editTraining } from '@/app/training/actions';
import Link from 'next/link';
import EmployeeSelect from '@/components/EmployeeSelect';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, GraduationCap, MapPin, Sparkles, User, Users } from 'lucide-react';

export const metadata = {
  title: 'Edit Training | HR ERP',
};

export default async function EditTrainingPage({ params }: { params: { id: string } }) {
  const training = await prisma.training.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      date: true,
      trainerId: true,
      trainer: { select: { id: true, name: true, workerId: true, designation: true } },
      workers: { select: { id: true, name: true, workerId: true, designation: true } }
    }
  });

  if (!training) {
    notFound();
  }

  // format date for datetime-local
  const dateObj = new Date(training.date);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);

  const updateAction = editTraining.bind(null, training.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Capacity Building</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Training</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Modify training details, schedule, venue, or enrolled workforce participants
          </p>
        </div>
        <Link 
          href={`/training/${training.id}`} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Details
        </Link>
      </div>

      {/* Glass Card Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm">
        <form action={updateAction} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-blue-600" />
              <span>Training Title *</span>
            </label>
            <input 
              type="text" 
              name="title" 
              defaultValue={training.title}
              required 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description &amp; Objectives
            </label>
            <textarea 
              name="description" 
              defaultValue={training.description || ''}
              rows={3}
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" />
              <span>Date &amp; Time *</span>
            </label>
            <input 
              type="datetime-local" 
              name="date" 
              defaultValue={localISOTime}
              required 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" />
              <span>Location / Venue</span>
            </label>
            <input 
              type="text" 
              name="location" 
              defaultValue={training.location || ''}
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-blue-600" />
              <span>Trainer (Search by Name or ID)</span>
            </label>
            <EmployeeSelect mode="single" inputName="trainerId" placeholder="Search Trainer..." initialSelected={training.trainer || undefined} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users size={14} className="text-blue-600" />
              <span>Select Employee Participants</span>
            </label>
            <EmployeeSelect initialSelected={training.workers} />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2"
            >
              <GraduationCap size={16} />
              <span>Update Training Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

