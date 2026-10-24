'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  validateBulkDeleteWorkers,
  bulkDeleteWorkers,
  BulkDeleteValidationResult,
} from '@/app/workers/actions';

export default function BulkDeleteWorkersModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [rawInput, setRawInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewFilter, setPreviewFilter] = useState('');
  const [copiedNotFound, setCopiedNotFound] = useState(false);

  // Preview & selection state
  const [validationData, setValidationData] = useState<BulkDeleteValidationResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmCheck, setConfirmCheck] = useState(false);

  const resetModal = () => {
    setIsOpen(false);
    setStep('input');
    setRawInput('');
    setIsValidating(false);
    setIsDeleting(false);
    setError(null);
    setSuccessMessage(null);
    setValidationData(null);
    setSelectedIds(new Set());
    setConfirmCheck(false);
    setPreviewFilter('');
    setCopiedNotFound(false);
  };

  // Keyboard shortcut: close modal on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting && !isValidating) {
        resetModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, isValidating]);

  const handleValidate = async () => {
    if (!rawInput.trim()) {
      setError('Please enter at least one Worker ID.');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const res = await validateBulkDeleteWorkers(rawInput);
      if (res.error) {
        setError(res.error);
        setIsValidating(false);
        return;
      }

      setValidationData(res);
      // Select all matched workers by default
      const matched = res.matchedWorkers || [];
      setSelectedIds(new Set(matched.map((w) => w.id)));
      setConfirmCheck(false);
      setPreviewFilter('');
      setStep('preview');
    } catch (err: any) {
      setError(err?.message || 'Failed to validate Worker IDs. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const toggleSelectAll = () => {
    if (!validationData?.matchedWorkers) return;
    if (selectedIds.size === validationData.matchedWorkers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validationData.matchedWorkers.map((w) => w.id)));
    }
  };

  const toggleSelect = (id: string) => {
    if (isDeleting) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCopyNotFound = async () => {
    if (!validationData?.notFoundIds || validationData.notFoundIds.length === 0) return;
    try {
      await navigator.clipboard.writeText(validationData.notFoundIds.join('\n'));
      setCopiedNotFound(true);
      setTimeout(() => setCopiedNotFound(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one employee to delete.');
      return;
    }
    if (!confirmCheck) {
      setError('Please acknowledge the confirmation checkbox before proceeding.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await bulkDeleteWorkers(Array.from(selectedIds));
      setIsDeleting(false);

      if (res.error) {
        setError(res.error);
        return;
      }

      setSuccessMessage(`Successfully moved ${res.count} employee(s) to the Recycle Bin.`);
      router.refresh();

      setTimeout(() => {
        resetModal();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Failed to bulk delete workers. Please try again.');
      setIsDeleting(false);
    }
  };

  const matchedWorkers = validationData?.matchedWorkers || [];
  const notFoundIds = validationData?.notFoundIds || [];
  const alreadyDeleted = validationData?.alreadyDeleted || [];

  const filteredMatchedWorkers = matchedWorkers.filter((w) => {
    if (!previewFilter.trim()) return true;
    const term = previewFilter.toLowerCase().trim();
    return (
      w.workerId.toLowerCase().includes(term) ||
      w.name.toLowerCase().includes(term) ||
      w.designation.toLowerCase().includes(term) ||
      w.department.toLowerCase().includes(term) ||
      w.company.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-rose-600/90 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 transition text-xs font-bold shadow-sm shadow-rose-600/20"
        title="Bulk Delete Employees by ID numbers"
      >
        <Trash2 size={15} /> Bulk Delete
      </button>

      {isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting && !isValidating) {
              resetModal();
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="glass-modal max-w-2xl w-full rounded-3xl border border-white/80 overflow-hidden my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-md border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-700 rounded-2xl border border-rose-200/50 shadow-xs">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    Bulk Delete Employees
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {step === 'input'
                      ? 'Step 1: Enter multiple Worker IDs'
                      : 'Step 2: Review matching records and confirm'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetModal}
                disabled={isValidating || isDeleting}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-white/60 transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 font-semibold">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 font-bold">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <div>{successMessage}</div>
                </div>
              )}

              {step === 'input' ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paste or type multiple Worker IDs below. You can separate IDs with{' '}
                    <strong className="text-slate-800">commas, spaces, or line breaks</strong>.
                  </p>

                  <div className="relative">
                    <textarea
                      rows={7}
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder={'EMP-1001\nEMP-1002, EMP-1003\nEMP-1004'}
                      disabled={isValidating}
                      className="w-full p-4 font-mono text-xs bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition text-slate-900 resize-y shadow-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-slate-400" />
                      Supports formats like: EMP-1001, 1002, 1003
                    </span>
                    {rawInput.trim() && (
                      <button
                        type="button"
                        onClick={() => setRawInput('')}
                        disabled={isValidating}
                        className="text-slate-400 hover:text-slate-700 underline font-semibold"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="leading-relaxed">
                      <strong>Recycle Bin Protection:</strong> Bulk deleted employees are safely
                      moved to the Recycle Bin and deactivated. Super Admins can restore them at any
                      time.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-rose-50/80 border border-rose-200/80 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                        Ready to Delete
                      </div>
                      <div className="text-2xl font-extrabold text-rose-700 mt-0.5">
                        {matchedWorkers.length}
                      </div>
                      <div className="text-[11px] text-rose-600">Active employees matched</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Not Found
                      </div>
                      <div className="text-2xl font-extrabold text-slate-700 mt-0.5">
                        {notFoundIds.length}
                      </div>
                      <div className="text-[11px] text-slate-500">IDs do not exist</div>
                    </div>

                    <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                        Already Deleted
                      </div>
                      <div className="text-2xl font-extrabold text-amber-700 mt-0.5">
                        {alreadyDeleted.length}
                      </div>
                      <div className="text-[11px] text-amber-600">Currently in Recycle Bin</div>
                    </div>
                  </div>

                  {/* Not Found warning */}
                  {notFoundIds.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800">Unmatched IDs ({notFoundIds.length}):</span>
                        <button
                          type="button"
                          onClick={handleCopyNotFound}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          {copiedNotFound ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copiedNotFound ? 'Copied!' : 'Copy IDs'}
                        </button>
                      </div>
                      <div className="font-mono text-slate-600 max-h-20 overflow-y-auto break-all">
                        {notFoundIds.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Already deleted note */}
                  {alreadyDeleted.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
                      <div className="font-bold mb-1">Already in Recycle Bin ({alreadyDeleted.length}):</div>
                      <div className="font-mono max-h-20 overflow-y-auto">
                        {alreadyDeleted.map((w) => `${w.workerId} (${w.name})`).join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Matched Workers Table */}
                  {matchedWorkers.length > 0 ? (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Users size={15} className="text-slate-500" />
                          Matching Employees ({selectedIds.size} of {matchedWorkers.length} selected)
                        </div>
                        <div className="flex items-center gap-3">
                          {matchedWorkers.length > 5 && (
                            <input
                              type="text"
                              placeholder="Filter matching..."
                              value={previewFilter}
                              onChange={(e) => setPreviewFilter(e.target.value)}
                              className="px-2.5 py-1 text-xs bg-white/70 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-rose-500 w-36"
                            />
                          )}
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            disabled={isDeleting}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold whitespace-nowrap disabled:opacity-50"
                          >
                            {selectedIds.size === matchedWorkers.length
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        </div>
                      </div>

                      <div className="border border-slate-200/80 rounded-2xl overflow-x-auto max-h-56 overflow-y-auto bg-white/50 backdrop-blur-sm">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 sticky top-0">
                            <tr>
                              <th className="p-2.5 w-8">
                                <input
                                  type="checkbox"
                                  checked={
                                    matchedWorkers.length > 0 &&
                                    selectedIds.size === matchedWorkers.length
                                  }
                                  disabled={isDeleting}
                                  onChange={toggleSelectAll}
                                  className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                              </th>
                              <th className="p-2.5 font-bold">Worker ID</th>
                              <th className="p-2.5 font-bold">Name</th>
                              <th className="p-2.5 font-bold">Designation</th>
                              <th className="p-2.5 font-bold">Department</th>
                              <th className="p-2.5 font-bold">Company</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredMatchedWorkers.map((w) => {
                              const isChecked = selectedIds.has(w.id);
                              return (
                                <tr
                                  key={w.id}
                                  onClick={() => toggleSelect(w.id)}
                                  className={`cursor-pointer transition ${
                                    isChecked ? 'bg-rose-50/60 hover:bg-rose-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <td className="p-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isDeleting}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSelect(w.id);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-slate-900">
                                    {w.workerId}
                                  </td>
                                  <td className="p-2.5 font-semibold text-slate-800">{w.name}</td>
                                  <td className="p-2.5 text-slate-600">{w.designation}</td>
                                  <td className="p-2.5 text-slate-600">{w.department}</td>
                                  <td className="p-2.5 text-slate-600">{w.company}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      No active employees matched the entered IDs.
                    </div>
                  )}

                  {/* Confirmation Checkbox */}
                  {matchedWorkers.length > 0 && (
                    <label className="flex items-start gap-2.5 p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl cursor-pointer hover:bg-rose-50 transition">
                      <input
                        type="checkbox"
                        checked={confirmCheck}
                        disabled={isDeleting}
                        onChange={(e) => setConfirmCheck(e.target.checked)}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 shrink-0 cursor-pointer"
                      />
                      <span className="text-xs text-rose-950 font-semibold">
                        I confirm that I want to move {selectedIds.size} selected employee(s) to the
                        Recycle Bin. They will be deactivated immediately.
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-md border-t border-slate-200/60">
              {step === 'preview' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError(null);
                    }}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200/80 rounded-xl text-xs text-slate-700 bg-white/80 hover:bg-white transition font-bold disabled:opacity-50 shadow-xs"
                  >
                    <ArrowLeft size={14} /> Back to Edit IDs
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting || selectedIds.size === 0 || !confirmCheck || !!successMessage}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Moving to Recycle Bin...
                      </>
                    ) : successMessage ? (
                      <>
                        <CheckCircle2 size={14} /> Deletion Completed
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} /> Confirm Bulk Delete ({selectedIds.size})
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={resetModal}
                    disabled={isValidating}
                    className="px-4 py-2 border border-slate-200/80 rounded-xl text-xs text-slate-700 bg-white/80 hover:bg-white transition font-bold disabled:opacity-50 shadow-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating || !rawInput.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Validating IDs...
                      </>
                    ) : (
                      <>
                        <Search size={14} /> Validate & Preview
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
