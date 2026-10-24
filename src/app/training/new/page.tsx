import { createTraining } from '../actions';
import Link from 'next/link';
import EmployeeSelect from '@/components/EmployeeSelect';
import { ArrowLeft, Calendar, GraduationCap, MapPin, Sparkles, User, Users } from 'lucide-react';

export const metadata = {
  title: 'Schedule Training | HR ERP',
};

export default function NewTrainingPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Capacity Building</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Schedule Training</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize a professional skill development workshop or compliance training program
          </p>
        </div>
        <Link 
          href="/training" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Training
        </Link>
      </div>

      {/* Glass Card Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm">
        <form action={createTraining} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-blue-600" />
              <span>Training Title *</span>
            </label>
            <input 
              type="text" 
              name="title" 
              required 
              placeholder="e.g. Electrical Safety and Quality Compliance"
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description &amp; Objectives
            </label>
            <textarea 
              name="description" 
              rows={3}
              placeholder="Summary of course curriculum, key takeaways, and prerequisites..."
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
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
              placeholder="e.g. Training Hall A, Barishal Plant"
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-blue-600" />
              <span>Trainer (Search by Name or ID)</span>
            </label>
            <EmployeeSelect mode="single" inputName="trainerId" placeholder="Search Trainer..." />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users size={14} className="text-blue-600" />
              <span>Select Employee Participants</span>
            </label>
            <EmployeeSelect />
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2"
            >
              <GraduationCap size={16} />
              <span>Schedule Training Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


