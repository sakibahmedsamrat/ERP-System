'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, 
  ArrowLeft, 
  Edit, 
  CreditCard, 
  FileText, 
  Upload, 
  History, 
  ShieldAlert, 
  HeartHandshake, 
  Calendar, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2, 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Sparkles,
  Award,
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { 
  uploadWorkerDocument, 
  deleteWorkerDocument, 
  addCareerHistory, 
  deleteCareerHistory, 
  updateNomineeAndEmergency, 
  addDisciplinaryRecord, 
  updateDisciplinaryStatus, 
  deleteDisciplinaryRecord 
} from '../actions';

interface Props {
  worker: any;
}

export default function Worker360Client({ worker }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get('tab');

  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'career' | 'nominee' | 'disciplinary'>(() => {
    if (initialTabParam === 'vault' || initialTabParam === 'career' || initialTabParam === 'nominee' || initialTabParam === 'disciplinary') {
      return initialTabParam;
    }
    return 'overview';
  });

  const switchTab = (tab: 'overview' | 'vault' | 'career' | 'nominee' | 'disciplinary') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const refreshPageWithCurrentTab = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.location.href = url.toString();
    } else {
      router.refresh();
    }
  };

  // Modals
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [careerLoading, setCareerLoading] = useState(false);

  const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
  const [nomineeLoading, setNomineeLoading] = useState(false);

  const [isDiscModalOpen, setIsDiscModalOpen] = useState(false);
  const [discLoading, setDiscLoading] = useState(false);

  // Tenure calculation
  const getTenure = (joinDateStr: string) => {
    if (!joinDateStr) return 'N/A';
    const join = new Date(joinDateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    if (years === 0 && months === 0) return `${diffDays} days`;
    if (years === 0) return `${months} months`;
    return `${years} yrs ${months} mos`;
  };

  // Handlers
  const handleUploadDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDocLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('workerId', worker.id);
    const res = await uploadWorkerDocument(formData);
    setDocLoading(false);
    if (res.success) {
      setIsDocModalOpen(false);
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to upload document');
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const res = await deleteWorkerDocument(docId, worker.id);
    if (res.success) {
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to delete document');
    }
  };

  const handleAddCareer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCareerLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('workerId', worker.id);
    const res = await addCareerHistory(formData);
    setCareerLoading(false);
    if (res.success) {
      setIsCareerModalOpen(false);
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to add career event');
    }
  };

  const handleDeleteCareer = async (historyId: string) => {
    if (!confirm('Are you sure you want to remove this career milestone?')) return;
    const res = await deleteCareerHistory(historyId, worker.id);
    if (res.success) {
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to delete record');
    }
  };

  const handleUpdateNominee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNomineeLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('workerId', worker.id);
    const res = await updateNomineeAndEmergency(formData);
    setNomineeLoading(false);
    if (res.success) {
      setIsNomineeModalOpen(false);
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to update details');
    }
  };

  const handleAddDisciplinary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDiscLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('workerId', worker.id);
    const res = await addDisciplinaryRecord(formData);
    setDiscLoading(false);
    if (res.success) {
      setIsDiscModalOpen(false);
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to record disciplinary incident');
    }
  };

  const handleUpdateDiscStatus = async (recordId: string, status: string) => {
    const actionTaken = prompt('Enter action taken or resolution notes (optional):') || undefined;
    const res = await updateDisciplinaryStatus(recordId, worker.id, status, actionTaken);
    if (res.success) {
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to update record');
    }
  };

  const handleDeleteDisciplinary = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this disciplinary record?')) return;
    const res = await deleteDisciplinaryRecord(recordId, worker.id);
    if (res.success) {
      refreshPageWithCurrentTab();
    } else {
      alert(res.error || 'Failed to delete record');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/workers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mb-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Employees
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
              <Sparkles size={13} /> Worker 360° Digital Dossier
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            {worker.name}
            <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              ID: {worker.workerId}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/workers/${worker.id}/edit`}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Edit size={14} /> Edit Profile
          </Link>
          <Link
            href={`/id-cards?workerDbId=${worker.id}`}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <CreditCard size={14} /> Generate ID Badge
          </Link>
        </div>
      </div>

      {/* Hero Profile Glass Card */}
      <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {worker.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={worker.photoUrl}
                alt={worker.name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
                {worker.name?.charAt(0) || <User size={36} />}
              </div>
            )}
            <span className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs ${
              worker.isActive ? 'bg-emerald-500 text-white border-white' : 'bg-rose-500 text-white border-white'
            }`}>
              {worker.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          {/* Quick info grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Designation</span>
              <span className="font-bold text-slate-900 text-sm">{worker.designation || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Company</span>
              <span className="font-bold text-slate-800 text-sm">{worker.company?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Department</span>
              <span className="font-bold text-slate-800 text-sm">{worker.department?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Section</span>
              <span className="font-bold text-slate-800 text-sm">{worker.section?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Join Date</span>
              <span className="font-semibold text-slate-700">{formatDate(worker.joinDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Service Tenure</span>
              <span className="font-semibold text-blue-600">{getTenure(worker.joinDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Blood Group</span>
              <span className="font-bold text-rose-600">{worker.bloodGroup || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Gross Salary</span>
              <span className="font-bold text-emerald-600">BDT {worker.grossSalary?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 glass-card bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass">
        <button
          onClick={() => switchTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <User size={15} /> Overview &amp; Demographics
        </button>

        <button
          onClick={() => switchTab('vault')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'vault'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <FileText size={15} /> Document Vault ({worker.documents?.length || 0})
        </button>

        <button
          onClick={() => switchTab('career')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'career'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <History size={15} /> Career History ({worker.careerHistory?.length || 0})
        </button>

        <button
          onClick={() => switchTab('nominee')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'nominee'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <HeartHandshake size={15} /> Nominee &amp; Emergency
        </button>

        <button
          onClick={() => switchTab('disciplinary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'disciplinary'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <ShieldAlert size={15} /> Disciplinary Ledger ({worker.disciplinaryRecords?.length || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">National ID (NID)</span>
                <span className="font-bold text-slate-800 font-mono">{worker.nationalId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Phone Number</span>
                <span className="font-semibold text-slate-800">{worker.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Gender</span>
                <span className="font-semibold text-slate-800">{worker.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Religion</span>
                <span className="font-semibold text-slate-800">{worker.religion || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Present Address</span>
                <span className="font-medium text-slate-700">{worker.address || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Permanent Address</span>
                <span className="font-medium text-slate-700">{worker.permanentAddress || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown & Confirmations */}
          <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" /> Salary Structure &amp; Compliance
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Basic Salary</span>
                <span className="font-bold text-slate-800">BDT {worker.basicSalary?.toLocaleString() || '0'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">House Rent</span>
                <span className="font-semibold text-slate-800">BDT {worker.houseRent?.toLocaleString() || '0'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Conveyance Allowance</span>
                <span className="font-semibold text-slate-800">BDT {worker.conveyanceAllowance?.toLocaleString() || '0'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Medical Allowance</span>
                <span className="font-semibold text-slate-800">BDT {worker.medicalAllowance?.toLocaleString() || '0'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Total Monthly Gross:</span>
                <span className="text-base font-extrabold text-emerald-600">BDT {worker.grossSalary?.toLocaleString() || '0'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Probation &amp; Confirmations</span>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block">6-Month Confirmation</span>
                  <span className="font-bold text-slate-800">
                    {worker.confirmed6mAt ? formatDate(worker.confirmed6mAt) : 'Pending'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block">3-Year Confirmation</span>
                  <span className="font-bold text-slate-800">
                    {worker.confirmed3yAt ? formatDate(worker.confirmed3yAt) : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Document Vault</h2>
              <p className="text-xs text-slate-500">Secure digital archive for NID, educational degrees, and medical fitness certificates</p>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Upload size={14} /> Upload Document
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {worker.documents?.map((doc: any) => (
              <div
                key={doc.id}
                className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{doc.fileSize || 'Doc'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{doc.title}</h4>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} /> Uploaded: {formatDate(doc.uploadedAt)}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Eye size={14} /> View Document
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="Delete Document"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {(!worker.documents || worker.documents.length === 0) && (
              <div className="col-span-full glass-card p-10 text-center rounded-3xl border border-white/70">
                <FileText size={36} className="text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No Documents Uploaded</h4>
                <p className="text-xs text-slate-400 mt-1">Upload NID copy, appointment letter, or medical slips to this worker&apos;s digital vault.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CAREER HISTORY TIMELINE */}
      {activeTab === 'career' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Career History Timeline</h2>
              <p className="text-xs text-slate-500">Track promotions, departmental transfers, grade promotions, and increments</p>
            </div>
            <button
              onClick={() => setIsCareerModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus size={14} /> Record Career Milestone
            </button>
          </div>

          <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
              {/* Initial Joining Milestone */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      JOINED COMPANY
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{formatDate(worker.joinDate)}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    Joined as {worker.designation || 'Staff'} in {worker.company?.name || 'MEP'}
                  </div>
                </div>
              </div>

              {/* Recorded career events */}
              {worker.careerHistory?.map((ch: any) => (
                <div key={ch.id} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="bg-white/80 p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {ch.changeType}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {ch.previousDesignation && ch.newDesignation ? `${ch.previousDesignation} → ${ch.newDesignation}` : (ch.newDesignation || ch.changeType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">{formatDate(ch.effectiveDate)}</span>
                        <button
                          onClick={() => handleDeleteCareer(ch.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete Milestone"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      {ch.newDepartment && (
                        <div>Dept: <span className="font-semibold text-slate-800">{ch.newDepartment}</span></div>
                      )}
                      {ch.newGrade && (
                        <div>Grade: <span className="font-semibold text-slate-800">{ch.newGrade}</span></div>
                      )}
                      {ch.newSalary && (
                        <div>New Salary: <span className="font-semibold text-emerald-600">BDT {ch.newSalary.toLocaleString()}</span></div>
                      )}
                    </div>

                    {ch.remarks && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg italic">
                        &quot;{ch.remarks}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOMINEE & EMERGENCY */}
      {activeTab === 'nominee' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nominee &amp; Emergency Contacts</h2>
              <p className="text-xs text-slate-500">Statutory nominee declaration and urgent factory contact details</p>
            </div>
            <button
              onClick={() => setIsNomineeModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Edit size={14} /> Update Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nominee Card */}
            <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
                <HeartHandshake size={18} className="text-rose-600" /> Nominee Declaration
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Nominee Name</span>
                  <span className="font-bold text-slate-900 text-sm">{worker.nomineeName || 'Not Declared'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Relationship</span>
                  <span className="font-semibold text-slate-800">{worker.nomineeRelation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Nominee NID</span>
                  <span className="font-mono font-semibold text-slate-800">{worker.nomineeNid || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Nominee Phone</span>
                  <span className="font-semibold text-slate-800">{worker.nomineePhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="glass-card bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-glass space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Phone size={18} className="text-amber-600" /> Emergency Contact
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Contact Person Name</span>
                  <span className="font-bold text-slate-900 text-sm">{worker.emergencyContactName || 'Not Set'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Relationship</span>
                  <span className="font-semibold text-slate-800">{worker.emergencyContactRelation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Emergency Phone Number</span>
                  <span className="font-bold text-blue-600 font-mono text-sm">{worker.emergencyContactPhone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DISCIPLINARY LEDGER */}
      {activeTab === 'disciplinary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Disciplinary Record Ledger</h2>
              <p className="text-xs text-slate-500">Official log of show-cause notices, written warnings, and penalties</p>
            </div>
            <button
              onClick={() => setIsDiscModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-500/20"
            >
              <Plus size={14} /> Record Disciplinary Action
            </button>
          </div>

          <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Incident Date</th>
                    <th className="p-4">Action Type</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Action Taken</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 bg-white/40">
                  {worker.disciplinaryRecords?.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="p-4 font-mono font-medium text-slate-700">{formatDate(rec.incidentDate)}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {rec.actionType}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">{rec.subject}</td>
                      <td className="p-4 text-slate-600 max-w-xs truncate" title={rec.description}>
                        {rec.description}
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{rec.actionTaken || '-'}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rec.status === 'RESOLVED' || rec.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end items-center gap-2">
                        {rec.status !== 'RESOLVED' && rec.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateDiscStatus(rec.id, 'RESOLVED')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDisciplinary(rec.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!worker.disciplinaryRecords || worker.disciplinaryRecords.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Clean disciplinary track record. No incidents or warnings on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD DOCUMENT */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Upload size={16} className="text-blue-600" /> Upload Document to Vault
              </h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleUploadDoc} className="space-y-4 mt-4" encType="multipart/form-data">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Document Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. National ID Front & Back, Medical Fitness"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category *</label>
                <select
                  name="category"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                >
                  <option value="NID">National ID / Smart Card</option>
                  <option value="CERTIFICATE">Academic / Trade Certificate</option>
                  <option value="MEDICAL">Medical Slip / Fitness Report</option>
                  <option value="CONTRACT">Appointment Letter / Contract</option>
                  <option value="POLICE">Police Clearance</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">File Attachment (JPG, PNG, PDF)</label>
                <input
                  type="file"
                  name="file"
                  accept="image/*,application/pdf"
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Or Document URL</label>
                <input
                  type="text"
                  name="fileUrl"
                  placeholder="https://... or data:..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {docLoading ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DOCUMENT */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-modal bg-white rounded-3xl border border-white/80 shadow-2xl max-w-3xl w-full p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{previewDoc.title}</h3>
                <span className="text-xs text-slate-400">{previewDoc.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.title}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                  title="Download File"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-700 p-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-slate-50 rounded-2xl p-4 min-h-[300px]">
              {previewDoc.fileUrl?.startsWith('data:image') || previewDoc.fileUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xs"
                />
              ) : previewDoc.fileUrl?.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(previewDoc.fileUrl || '') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[60vh] border-0 rounded-xl"
                />
              ) : (
                <div className="text-center p-6">
                  <FileText size={48} className="text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Preview not natively supported for this format</p>
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    <ExternalLink size={14} /> Open in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CAREER MILESTONE */}
      {isCareerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <History size={16} className="text-blue-600" /> Record Career Milestone
              </h3>
              <button onClick={() => setIsCareerModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCareer} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Milestone Type *</label>
                  <select
                    name="changeType"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="PROMOTION">Promotion</option>
                    <option value="TRANSFER">Departmental Transfer</option>
                    <option value="INCREMENT">Salary Increment</option>
                    <option value="GRADE_CHANGE">Grade Reclassification</option>
                    <option value="CONFIRMATION">Permanent Confirmation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Effective Date *</label>
                  <input
                    type="date"
                    name="effectiveDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Previous Designation</label>
                  <input
                    type="text"
                    name="previousDesignation"
                    defaultValue={worker.designation || ''}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Designation</label>
                  <input
                    type="text"
                    name="newDesignation"
                    placeholder="e.g. Senior Operator"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Department</label>
                  <input
                    type="text"
                    name="newDepartment"
                    placeholder="e.g. Sewing Finishing"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Grade</label>
                  <input
                    type="text"
                    name="newGrade"
                    placeholder="e.g. Grade 4"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Previous Gross</label>
                  <input
                    type="number"
                    name="previousSalary"
                    defaultValue={worker.grossSalary || 0}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Gross</label>
                  <input
                    type="number"
                    name="newSalary"
                    placeholder="e.g. 16500"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Remarks / Note</label>
                <textarea
                  name="remarks"
                  rows={2}
                  placeholder="Official appraisal remarks or promotion memo reference..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCareerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={careerLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {careerLoading ? 'Saving...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE NOMINEE & EMERGENCY */}
      {isNomineeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <HeartHandshake size={16} className="text-blue-600" /> Update Nominee &amp; Emergency
              </h3>
              <button onClick={() => setIsNomineeModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateNominee} className="space-y-4 mt-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b">
                Emergency Contact
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    defaultValue={worker.emergencyContactName || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relationship</label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    placeholder="e.g. Spouse, Father"
                    defaultValue={worker.emergencyContactRelation || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Emergency Phone Number</label>
                <input
                  type="text"
                  name="emergencyContactPhone"
                  defaultValue={worker.emergencyContactPhone || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-2 pb-1 border-b">
                Nominee Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominee Name</label>
                  <input
                    type="text"
                    name="nomineeName"
                    defaultValue={worker.nomineeName || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominee Relationship</label>
                  <input
                    type="text"
                    name="nomineeRelation"
                    defaultValue={worker.nomineeRelation || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominee NID</label>
                  <input
                    type="text"
                    name="nomineeNid"
                    defaultValue={worker.nomineeNid || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominee Phone</label>
                  <input
                    type="text"
                    name="nomineePhone"
                    defaultValue={worker.nomineePhone || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNomineeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={nomineeLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {nomineeLoading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DISCIPLINARY RECORD */}
      {isDiscModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600" /> Record Disciplinary Incident
              </h3>
              <button onClick={() => setIsDiscModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddDisciplinary} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Action Type *</label>
                  <select
                    name="actionType"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="SHOW_CAUSE">Show-Cause Notice</option>
                    <option value="VERBAL_WARNING">Verbal Warning</option>
                    <option value="WRITTEN_WARNING">Written Warning Letter</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="PENALTY">Financial Fine / Penalty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Incident Date *</label>
                  <input
                    type="date"
                    name="incidentDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject / Violation *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="e.g. Unannounced absenteeism, safety protocol violation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Incident Description *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Detailed description of the incident..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Action Taken</label>
                  <input
                    type="text"
                    name="actionTaken"
                    placeholder="e.g. 1st formal warning letter issued"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    name="status"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiscModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={discLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  {discLoading ? 'Saving...' : 'Record Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
