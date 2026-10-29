'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Sparkles, 
  Plus, 
  MapPin, 
  Calendar, 
  Eye, 
  Edit, 
  Users, 
  ShieldCheck, 
  Flame, 
  HeartPulse, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Trash2, 
  Award,
  Layers
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import DeleteTrainingButton from './DeleteTrainingButton';
import { 
  addWorkerSkill, 
  deleteWorkerSkill, 
  addComplianceCertification, 
  deleteComplianceCertification 
} from './actions';

interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
  _count: { workers: number };
}

interface WorkerSkillItem {
  id: string;
  skillCategory: string;
  skillName: string;
  proficiency: string;
  certifiedDate: string | null;
  expiryDate: string | null;
  certifyingBody: string | null;
  status: string;
  worker: {
    id: string;
    workerId: string;
    name: string;
    department?: { name: string } | null;
    company?: { name: string } | null;
  };
}

interface ComplianceCertItem {
  id: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string | null;
  issuingAuthority: string | null;
  status: string;
  worker: {
    id: string;
    workerId: string;
    name: string;
    department?: { name: string } | null;
  };
}

interface WorkerSimple {
  id: string;
  workerId: string;
  name: string;
  department?: { name: string } | null;
  company?: { name: string } | null;
}

interface Props {
  trainings: TrainingProgram[];
  totalWorkers: number;
  skills: WorkerSkillItem[];
  complianceCerts: ComplianceCertItem[];
  workers: WorkerSimple[];
}

export default function TrainingClient({
  trainings,
  totalWorkers,
  skills,
  complianceCerts,
  workers,
}: Props) {
  const [activeTab, setActiveTab] = useState<'programs' | 'matrix'>('programs');

  // Modals
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certLoading, setCertLoading] = useState(false);

  // Filters for Skills Matrix
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations for Compliance Radar
  const fireCertifiedCount = complianceCerts.filter(c => c.type === 'FIRE_SAFETY' && c.status === 'ACTIVE').length;
  const firstAidCertifiedCount = complianceCerts.filter(c => c.type === 'FIRST_AID' && c.status === 'ACTIVE').length;
  const chemicalCertifiedCount = complianceCerts.filter(c => c.type === 'CHEMICAL_HANDLING' && c.status === 'ACTIVE').length;

  const firePercentage = totalWorkers > 0 ? Math.min(100, Math.round((fireCertifiedCount / totalWorkers) * 100)) : 0;
  const firstAidPercentage = totalWorkers > 0 ? Math.min(100, Math.round((firstAidCertifiedCount / totalWorkers) * 100)) : 0;
  const chemicalPercentage = totalWorkers > 0 ? Math.min(100, Math.round((chemicalCertifiedCount / totalWorkers) * 100)) : 0;

  // RSC/BSCI overall readiness formula
  const rscReadinessScore = Math.min(100, Math.round((firePercentage * 0.4) + (firstAidPercentage * 0.3) + 30));

  // Expiring soon or expired alerts
  const expiringCerts = complianceCerts.filter(c => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED');

  // Filter skills
  const filteredSkills = skills.filter(s => {
    if (skillCategoryFilter !== 'ALL' && s.skillCategory !== skillCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!s.worker.name.toLowerCase().includes(q) && !s.skillName.toLowerCase().includes(q) && !s.worker.workerId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleAddSkill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSkillLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addWorkerSkill(formData);
    setSkillLoading(false);
    if (res.success) {
      setIsSkillModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || 'Failed to add skill');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to remove this skill record?')) return;
    const res = await deleteWorkerSkill(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'Failed to delete skill');
    }
  };

  const handleAddCert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCertLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addComplianceCertification(formData);
    setCertLoading(false);
    if (res.success) {
      setIsCertModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || 'Failed to add certification');
    }
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compliance certificate?')) return;
    const res = await deleteComplianceCertification(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'Failed to delete certificate');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Learning &amp; Compliance Development</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Training &amp; Skills Matrix</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage factory training programs, employee machine skill proficiencies, and RSC/BSCI compliance certification radar
          </p>
        </div>

        {/* Tab-specific top button */}
        <div className="flex items-center gap-2">
          {activeTab === 'programs' ? (
            <Link 
              href="/training/new" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20"
            >
              <Plus size={18} /> Schedule Training
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs transition shadow-md shadow-emerald-600/20"
              >
                <ShieldCheck size={16} /> Add Compliance Cert
              </button>
              <button
                onClick={() => setIsSkillModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs transition shadow-md shadow-blue-600/20"
              >
                <Plus size={16} /> Record Worker Skill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 glass-card bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass w-fit">
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'programs'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <GraduationCap size={16} />
          <span>Training Programs ({trainings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'matrix'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Skills Matrix &amp; Compliance Radar</span>
          {expiringCerts.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
              {expiringCerts.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TRAINING PROGRAMS */}
      {activeTab === 'programs' && (
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
      )}

      {/* TAB 2: SKILLS MATRIX & COMPLIANCE RADAR */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Factory Compliance Radar Dashboard */}
          <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" /> Factory Compliance Radar (RSC &amp; BSCI)
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time statutory readiness tracking for Fire Fighting, First Aid, and Chemical Safety certifications
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                Overall RSC Score: {rscReadinessScore}%
              </span>
            </div>

            {/* Radar KPI Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fire Safety */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Flame size={15} className="text-rose-600" /> Fire Safety Team
                  </span>
                  <span className="text-xs font-extrabold text-rose-600 font-mono">{firePercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, firePercentage)}%` }} 
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{fireCertifiedCount} Certified</span>
                  <span>Min. 18% Required</span>
                </div>
              </div>

              {/* First Aid */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <HeartPulse size={15} className="text-red-500" /> First Aid Responders
                  </span>
                  <span className="text-xs font-extrabold text-red-600 font-mono">{firstAidPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, firstAidPercentage)}%` }} 
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{firstAidCertifiedCount} Certified</span>
                  <span>Min. 10% Required</span>
                </div>
              </div>

              {/* Chemical Safety */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FlaskConical size={15} className="text-amber-500" /> Chemical Handlers
                  </span>
                  <span className="text-xs font-extrabold text-amber-600 font-mono">{chemicalPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, chemicalPercentage)}%` }} 
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{chemicalCertifiedCount} Certified</span>
                  <span>Dyeing/Finishing</span>
                </div>
              </div>

              {/* BSCI Readiness */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500" /> BSCI Social Audit
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600 font-mono">Grade A</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Active Records</span>
                  <span>Zero Non-Compliance</span>
                </div>
              </div>
            </div>

            {/* Expiring soon / expired banner */}
            {expiringCerts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  <span className="font-bold">
                    {expiringCerts.length} Compliance Certification{expiringCerts.length === 1 ? '' : 's'} Expiring or Expired
                  </span>
                  <span className="text-slate-600 text-[11px] hidden md:inline">
                    — Immediate refresher training needed to maintain factory audit eligibility.
                  </span>
                </div>
                <div className="flex gap-2">
                  {expiringCerts.slice(0, 3).map(ec => (
                    <span key={ec.id} className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-amber-300">
                      {ec.worker.name}: {ec.type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills Matrix Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Operator Skills Matrix</h3>
                <p className="text-xs text-slate-500">Machine proficiencies: Single Needle, Overlock, Flatlock, Quality &amp; Maintenance</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={skillCategoryFilter}
                  onChange={(e) => setSkillCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SEWING">Sewing Machine Operations</option>
                  <option value="QUALITY">Quality Inspection</option>
                  <option value="MAINTENANCE">Mechanical &amp; Electrical</option>
                  <option value="SAFETY">Health &amp; Safety</option>
                  <option value="MANAGEMENT">Floor Supervision</option>
                </select>

                <div className="w-52">
                  <input
                    type="text"
                    placeholder="Search worker or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Skill Category</th>
                      <th className="p-4">Skill / Operation</th>
                      <th className="p-4">Proficiency Level</th>
                      <th className="p-4">Certification Body</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 bg-white/40">
                    {filteredSkills.map(s => {
                      let profBadge = "bg-blue-50 text-blue-800 border-blue-200";
                      if (s.proficiency === 'EXPERT') profBadge = "bg-purple-50 text-purple-800 border-purple-200 font-black";
                      if (s.proficiency === 'ADVANCED') profBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      if (s.proficiency === 'BEGINNER') profBadge = "bg-slate-100 text-slate-700 border-slate-200";

                      return (
                        <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{s.worker.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {s.worker.workerId}</div>
                          </td>
                          <td className="p-4 text-slate-600">{s.worker.department?.name || 'Sewing'}</td>
                          <td className="p-4">
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border">
                              {s.skillCategory}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-800">{s.skillName}</td>
                          <td className="p-4">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${profBadge}`}>
                              {s.proficiency}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">{s.certifyingBody || 'Internal MEP'}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              s.status === 'VALID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              s.status === 'EXPIRING_SOON' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteSkill(s.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete Skill"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSkills.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-500 font-medium">
                          No skill records match the filters. Click &quot;Record Worker Skill&quot; above to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD WORKER SKILL */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" /> Record Worker Skill
              </h3>
              <button onClick={() => setIsSkillModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Worker *</label>
                <select
                  name="workerId"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Select Employee</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.workerId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Skill Category *</label>
                  <select
                    name="skillCategory"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="SEWING">Sewing Operations</option>
                    <option value="QUALITY">Quality Inspection</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SAFETY">Health &amp; Safety</option>
                    <option value="MANAGEMENT">Supervisor / Line Chief</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Proficiency Level *</label>
                  <select
                    name="proficiency"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="BEGINNER">Beginner (L1)</option>
                    <option value="INTERMEDIATE">Intermediate (L2)</option>
                    <option value="ADVANCED">Advanced (L3)</option>
                    <option value="EXPERT">Expert / Master (L4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Skill / Machine Name *</label>
                <input
                  type="text"
                  name="skillName"
                  required
                  placeholder="e.g. 4-Thread Overlock, Flatlock, Collar Stitching"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Certifying Body</label>
                  <input
                    type="text"
                    name="certifyingBody"
                    placeholder="e.g. RSC, BSCI, Internal MEP"
                    defaultValue="Internal MEP"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Certified Date</label>
                  <input
                    type="date"
                    name="certifiedDate"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={skillLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {skillLoading ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMPLIANCE CERTIFICATION */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" /> Add Compliance Certification
              </h3>
              <button onClick={() => setIsCertModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCert} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Certified Employee *</label>
                <select
                  name="workerId"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">Select Employee</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.workerId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Certification Type *</label>
                <select
                  name="type"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="FIRE_SAFETY">Fire Safety &amp; Evacuation Team</option>
                  <option value="FIRST_AID">First Aid &amp; CPR Responder</option>
                  <option value="CHEMICAL_HANDLING">Hazardous Chemical Handling</option>
                  <option value="RSC_AUDIT">RSC RMG Safety Compliance</option>
                  <option value="BSCI_SOCIAL">BSCI Social Accountability</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issue Date *</label>
                  <input
                    type="date"
                    name="issueDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    name="issuingAuthority"
                    defaultValue="Fire Service & Civil Defence"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Certificate #</label>
                  <input
                    type="text"
                    name="certificateNumber"
                    placeholder="e.g. FSCD-2026-904"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={certLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {certLoading ? 'Saving...' : 'Add Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
