'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import {
  validateBulkDeleteWorkers,
  bulkDeleteWorkers,
  MatchedWorkerPreview,
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
  };

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
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
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
      if (res.error) {
        setError(res.error);
        setIsDeleting(false);
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition text-sm font-medium shadow-sm"
        title="Bulk Delete Employees by ID numbers"
      >
        <Trash2 size={16} /> Bulk Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/80 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    Bulk Delete Employees
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step === 'input'
                      ? 'Step 1: Enter multiple Worker IDs'
                      : 'Step 2: Review matching records and confirm'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetModal}
                disabled={isValidating || isDeleting}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2.5 font-semibold">
                  <CheckCircle2 size={20} className="shrink-0 text-green-600" />
                  <div>{successMessage}</div>
                </div>
              )}

              {step === 'input' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Paste or type multiple Worker IDs below. You can separate IDs with{' '}
                    <strong className="text-gray-800">commas, spaces, or line breaks</strong>.
                  </p>

                  <div className="relative">
                    <textarea
                      rows={7}
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder={'EMP-1001\nEMP-1002, EMP-1003\nEMP-1004'}
                      disabled={isValidating}
                      className="w-full p-3.5 font-mono text-sm border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition bg-gray-50/50 hover:bg-white resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-gray-400" />
                      Supports formats like: EMP-1001, 1002, 1003
                    </span>
                    {rawInput.trim() && (
                      <button
                        type="button"
                        onClick={() => setRawInput('')}
                        className="text-gray-400 hover:text-gray-600 underline font-medium"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
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
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <div className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                        Ready to Delete
                      </div>
                      <div className="text-2xl font-bold text-red-700 mt-0.5">
                        {matchedWorkers.length}
                      </div>
                      <div className="text-[11px] text-red-600">Active employees matched</div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Not Found
                      </div>
                      <div className="text-2xl font-bold text-gray-700 mt-0.5">
                        {notFoundIds.length}
                      </div>
                      <div className="text-[11px] text-gray-500">IDs do not exist</div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                        Already Deleted
                      </div>
                      <div className="text-2xl font-bold text-amber-700 mt-0.5">
                        {alreadyDeleted.length}
                      </div>
                      <div className="text-[11px] text-amber-600">Currently in Recycle Bin</div>
                    </div>
                  </div>

                  {/* Not Found warning */}
                  {notFoundIds.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700">
                      <span className="font-semibold text-gray-800">Unmatched IDs:</span>{' '}
                      <span className="font-mono text-gray-600">{notFoundIds.join(', ')}</span>
                    </div>
                  )}

                  {/* Already deleted note */}
                  {alreadyDeleted.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      <span className="font-semibold">Already in Recycle Bin:</span>{' '}
                      <span className="font-mono">
                        {alreadyDeleted.map((w) => `${w.workerId} (${w.name})`).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Matched Workers Table */}
                  {matchedWorkers.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Users size={16} className="text-gray-500" />
                          Matching Employees ({selectedIds.size} of {matchedWorkers.length} selected)
                        </div>
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {selectedIds.size === matchedWorkers.length
                            ? 'Deselect All'
                            : 'Select All'}
                        </button>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 sticky top-0">
                            <tr>
                              <th className="p-2.5 w-8">
                                <input
                                  type="checkbox"
                                  checked={
                                    matchedWorkers.length > 0 &&
                                    selectedIds.size === matchedWorkers.length
                                  }
                                  onChange={toggleSelectAll}
                                  className="rounded text-red-600 focus:ring-red-500"
                                />
                              </th>
                              <th className="p-2.5 font-semibold">Worker ID</th>
                              <th className="p-2.5 font-semibold">Name</th>
                              <th className="p-2.5 font-semibold">Designation</th>
                              <th className="p-2.5 font-semibold">Department</th>
                              <th className="p-2.5 font-semibold">Company</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {matchedWorkers.map((w) => {
                              const isChecked = selectedIds.has(w.id);
                              return (
                                <tr
                                  key={w.id}
                                  onClick={() => toggleSelect(w.id)}
                                  className={`cursor-pointer transition ${
                                    isChecked ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <td className="p-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="rounded text-red-600 focus:ring-red-500"
                                    />
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-gray-900">
                                    {w.workerId}
                                  </td>
                                  <td className="p-2.5 font-medium text-gray-800">{w.name}</td>
                                  <td className="p-2.5 text-gray-600">{w.designation}</td>
                                  <td className="p-2.5 text-gray-600">{w.department}</td>
                                  <td className="p-2.5 text-gray-600">{w.company}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                      No active employees matched the entered IDs.
                    </div>
                  )}

                  {/* Confirmation Checkbox */}
                  {matchedWorkers.length > 0 && (
                    <label className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200 rounded-xl cursor-pointer hover:bg-red-50 transition">
                      <input
                        type="checkbox"
                        checked={confirmCheck}
                        onChange={(e) => setConfirmCheck(e.target.checked)}
                        className="mt-0.5 rounded text-red-600 focus:ring-red-500 shrink-0"
                      />
                      <span className="text-xs text-red-900 font-medium">
                        I confirm that I want to move {selectedIds.size} selected employee(s) to the
                        Recycle Bin. They will be deactivated immediately.
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              {step === 'preview' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError(null);
                    }}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition font-medium disabled:opacity-50"
                  >
                    <ArrowLeft size={16} /> Back to Edit IDs
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting || selectedIds.size === 0 || !confirmCheck}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Moving to Recycle Bin...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} /> Confirm Bulk Delete ({selectedIds.size})
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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating || !rawInput.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-gray-900 text-white hover:bg-black transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Validating IDs...
                      </>
                    ) : (
                      <>
                        <Search size={16} /> Validate & Preview
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
