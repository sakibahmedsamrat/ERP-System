'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Award, 
  ArrowRight, 
  X, 
  Briefcase, 
  Phone, 
  Building2, 
  DollarSign, 
  Check, 
  XCircle,
  ExternalLink,
  Scissors
} from 'lucide-react';
import { addCandidate, updateCandidateStage, onboardCandidate } from './actions';

export interface CandidateItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  stage: string;
  status: string;
  appliedRole: string | null;
  experienceYears: number | null;
  expectedSalary: number | null;
  testScore: number | null;
  testNotes: string | null;
  interviewNotes: string | null;
  companyId: string | null;
  company?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  hiredAsWorkerId: string | null;
  createdAt: string;
}

interface Props {
  candidates: CandidateItem[];
  companies: { id: string; name: string; departments: { id: string; name: string }[] }[];
}

const STAGES = [
  { key: 'APPLIED', label: '1. Applied', color: 'border-slate-300 bg-slate-50/50' },
  { key: 'SHORTLISTED', label: '2. Shortlisted', color: 'border-blue-300 bg-blue-50/40' },
  { key: 'SEWING_TEST', label: '3. Sewing / Practical Test', color: 'border-amber-300 bg-amber-50/40' },
  { key: 'INTERVIEW', label: '4. Interview', color: 'border-purple-300 bg-purple-50/40' },
  { key: 'OFFERED', label: '5. Offered', color: 'border-indigo-300 bg-indigo-50/40' },
  { key: 'HIRED', label: '6. Hired & Onboard', color: 'border-emerald-300 bg-emerald-50/40' },
];

export default function ATSPipelineSection({ candidates, companies }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [onboardLoadingId, setOnboardLoadingId] = useState<string | null>(null);

  // Score modal
  const [scoreModalCandidate, setScoreModalCandidate] = useState<CandidateItem | null>(null);
  const [scoreInput, setScoreInput] = useState('85');
  const [scoreNotes, setScoreNotes] = useState('');

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  const filteredCandidates = candidates.filter(c => {
    if (filterCompany && c.companyId !== filterCompany) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q) && !(c.appliedRole && c.appliedRole.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  const reloadPipelineTab = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'pipeline');
      window.location.href = url.toString();
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addCandidate(formData);
    setAddLoading(false);
    if (res.success) {
      setIsAddModalOpen(false);
      reloadPipelineTab();
    } else {
      alert(res.error || 'Failed to add candidate');
    }
  };

  const handleAdvanceStage = async (candidate: CandidateItem) => {
    const currentIndex = STAGES.findIndex(s => s.key === candidate.stage);
    if (currentIndex < 0 || currentIndex >= STAGES.length - 1) return;

    const nextStage = STAGES[currentIndex + 1].key;

    // If advancing into or past SEWING_TEST, prompt for practical test score
    if (nextStage === 'SEWING_TEST' || (candidate.stage === 'SEWING_TEST' && !candidate.testScore)) {
      setScoreModalCandidate(candidate);
      return;
    }

    const res = await updateCandidateStage(candidate.id, nextStage);
    if (res.success) {
      reloadPipelineTab();
    } else {
      alert(res.error || 'Failed to advance stage');
    }
  };

  const handleSaveScoreAndAdvance = async () => {
    if (!scoreModalCandidate) return;
    const scoreNum = parseFloat(scoreInput) || 80;
    const res = await updateCandidateStage(scoreModalCandidate.id, 'INTERVIEW', {
      testScore: scoreNum,
      testNotes: scoreNotes || 'Passed sewing efficiency practical test'
    });
    setScoreModalCandidate(null);
    if (res.success) {
      reloadPipelineTab();
    } else {
      alert(res.error || 'Failed to save test score');
    }
  };

  const handleReject = async (candidateId: string) => {
    if (!confirm('Mark this candidate as Rejected?')) return;
    const res = await updateCandidateStage(candidateId, 'REJECTED');
    if (res.success) {
      reloadPipelineTab();
    } else {
      alert(res.error || 'Failed to reject candidate');
    }
  };

  const handle1ClickOnboard = async (candidate: CandidateItem) => {
    if (!confirm(`Confirm 1-Click Onboard for ${candidate.name}?\nThis will create an active Worker profile in the ERP.`)) return;

    setOnboardLoadingId(candidate.id);
    const res = await onboardCandidate(candidate.id);
    setOnboardLoadingId(null);

    if (res.success) {
      alert(`Success! ${candidate.name} onboarded with Employee ID: ${res.workerId}`);
      reloadPipelineTab();
    } else {
      alert(res.error || 'Failed to onboard candidate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles size={20} className="text-blue-600" /> ATS Candidate Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end recruitment tracking from application &rarr; sewing skill test &rarr; 1-click active employee onboarding
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search candidate name, phone, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 w-56"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 whitespace-nowrap"
          >
            <UserPlus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageCandidates = filteredCandidates.filter(c => c.stage === stage.key);

          return (
            <div
              key={stage.key}
              className={`rounded-2xl border p-3 flex flex-col space-y-3 min-h-[450px] ${stage.color}`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="font-extrabold text-xs text-slate-800">{stage.label}</span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 border shadow-xs">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards list */}
              <div className="space-y-3 flex-1">
                {stageCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs hover:shadow-md transition space-y-2 relative"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{cand.name}</div>
                      <div className="text-[11px] text-blue-700 font-semibold">{cand.appliedRole || 'Operator'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {cand.phone}
                      </div>
                    </div>

                    <div className="pt-1 text-[10px] text-slate-600 space-y-0.5 border-t border-slate-100">
                      {cand.expectedSalary && (
                        <div>Salary: <span className="font-semibold text-slate-800">BDT {cand.expectedSalary.toLocaleString()}</span></div>
                      )}
                      {cand.testScore !== null && cand.testScore !== undefined && (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1">
                          <Scissors size={11} /> Test: {cand.testScore}/100
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      {stage.key !== 'HIRED' ? (
                        <>
                          <button
                            onClick={() => handleAdvanceStage(cand)}
                            className="flex-1 py-1 px-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                          >
                            <span>Advance</span>
                            <ChevronRight size={12} />
                          </button>
                          <button
                            onClick={() => handleReject(cand.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      ) : (
                        cand.hiredAsWorkerId ? (
                          <Link
                            href={`/workers/${cand.hiredAsWorkerId}`}
                            className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-extrabold transition flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>View 360° Dossier</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => handle1ClickOnboard(cand)}
                            disabled={onboardLoadingId === cand.id}
                            className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition flex items-center justify-center gap-1"
                          >
                            <Award size={12} />
                            <span>{onboardLoadingId === cand.id ? 'Onboarding...' : '1-Click Onboard'}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}

                {stageCandidates.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-[11px] font-medium italic">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD CANDIDATE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" /> Add Candidate to ATS Pipeline
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Applied Role *</label>
                  <input
                    type="text"
                    name="appliedRole"
                    required
                    placeholder="e.g. Overlock Operator, Quality Inspector"
                    defaultValue="Sewing Machine Operator"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="experienceYears"
                    placeholder="e.g. 2.5"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expected Gross Salary (BDT)</label>
                  <input
                    type="number"
                    name="expectedSalary"
                    placeholder="e.g. 13500"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Company</label>
                  <select
                    name="companyId"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  >
                    <option value="">Any Factory</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Optional email address"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {addLoading ? 'Saving...' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD SEWING / PRACTICAL TEST SCORE */}
      {scoreModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-sm w-full p-6 relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Scissors size={16} className="text-amber-600" /> Record Practical Test Score
              </h3>
              <button onClick={() => setScoreModalCandidate(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Recording practical evaluation for <span className="font-bold text-slate-900">{scoreModalCandidate.name}</span> ({scoreModalCandidate.appliedRole || 'Operator'})
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Practical Test Score (0 - 100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Evaluator Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Good stitch tension, 85% standard speed achieved"
                value={scoreNotes}
                onChange={(e) => setScoreNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScoreModalCandidate(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScoreAndAdvance}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
              >
                Save &amp; Move to Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
