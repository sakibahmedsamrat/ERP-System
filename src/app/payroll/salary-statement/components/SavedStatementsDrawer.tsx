'use client';

import React, { memo } from 'react';
import {
  Bookmark,
  RefreshCw,
  X,
  Search,
  Loader2,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Building2,
  Printer,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

export interface SavedStatementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedStatements: any[];
  savedStatementsTotal: number;
  isLoadingSaved: boolean;
  onRefresh: () => void;
  savedSearchQuery: string;
  onSavedSearchChange: (q: string) => void;
  onLoadStatement: (statement: any, autoPrint?: boolean) => void;
  onDeleteStatement: (id: string, e?: React.MouseEvent) => void;
  activeStatementId: string | null;
  loadingStatementId: string | null;
  deletingId: string | null;
  deleteConfirmId: string | null;
  onSetDeleteConfirmId: (id: string | null) => void;
  normalizeStatementData: (data: any) => any;
}

export const SavedStatementsDrawer = memo(function SavedStatementsDrawer({
  isOpen,
  onClose,
  savedStatements,
  savedStatementsTotal,
  isLoadingSaved,
  onRefresh,
  savedSearchQuery,
  onSavedSearchChange,
  onLoadStatement,
  onDeleteStatement,
  activeStatementId,
  loadingStatementId,
  deletingId,
  deleteConfirmId,
  onSetDeleteConfirmId,
  normalizeStatementData,
}: SavedStatementsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 print:hidden overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 safe-pb">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Bookmark size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Saved Statements</h3>
                  <span className="bg-blue-100 text-blue-700 font-extrabold text-xs px-2 py-0.5 rounded-full">
                    {savedStatementsTotal}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Search, load, print, or manage saved statements</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoadingSaved}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                title="Refresh statements list"
                aria-label="Refresh statements list"
              >
                <RefreshCw size={17} className={isLoadingSaved ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by worker name, ID, ref no, or date..."
                value={savedSearchQuery}
                onChange={(e) => onSavedSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {savedSearchQuery && (
                <button
                  type="button"
                  onClick={() => onSavedSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Statements List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoadingSaved ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-semibold">Loading saved statements...</p>
              </div>
            ) : savedStatements.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <FileSpreadsheet size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No saved statements found</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {savedSearchQuery
                    ? 'No records match your search criteria. Try a different keyword.'
                    : 'Save your first salary statement using the Save button in the editor above.'}
                </p>
              </div>
            ) : (
              savedStatements.map((stmt) => {
                const isCurrentActive = activeStatementId === stmt.id;
                const isCurrentlyLoading = loadingStatementId === stmt.id;
                const isCurrentlyDeleting = deletingId === stmt.id;
                const isConfirmingDelete = deleteConfirmId === stmt.id;
                const data = normalizeStatementData(stmt.data);
                const fd = typeof data === 'object' && data.formData ? data.formData : data;
                const netAmount =
                  fd.monthlyPayableAmount ||
                  (Array.isArray(fd.months) && fd.months[2]?.netPayable) ||
                  null;

                return (
                  <div
                    key={stmt.id}
                    className={`bg-white rounded-2xl p-4 border transition-all shadow-xs hover:shadow-md ${
                      isCurrentActive
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block">
                          {stmt.refNo}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {stmt.statementDate
                            ? `Date: ${stmt.statementDate}`
                            : `Created: ${formatDate(stmt.createdAt)}`}
                        </div>
                      </div>
                      {isCurrentActive && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{stmt.name}</span>
                        {stmt.workerId && (
                          <span className="text-[11px] font-mono text-slate-500 font-semibold">
                            ({stmt.workerId})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {stmt.designation && <span>{stmt.designation}</span>}
                        {stmt.designation && stmt.department && <span>•</span>}
                        {stmt.department && (
                          <span className="flex items-center gap-1">
                            <Building2 size={11} className="text-slate-400" />
                            <span>{stmt.department}</span>
                          </span>
                        )}
                      </div>
                      {netAmount && (
                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                          <DollarSign size={13} className="text-emerald-600" />
                          <span>Net Payable: {Number(netAmount).toLocaleString()} BDT</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onLoadStatement(stmt, false)}
                          disabled={isCurrentlyLoading}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
                        >
                          {isCurrentlyLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <FileText size={12} />
                          )}
                          <span>Load</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onLoadStatement(stmt, true)}
                          disabled={isCurrentlyLoading}
                          className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          title="Load statement and open print dialog"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>
                      </div>

                      <div>
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => onDeleteStatement(stmt.id, e)}
                              disabled={isCurrentlyDeleting}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[11px] font-bold transition"
                            >
                              {isCurrentlyDeleting ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetDeleteConfirmId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[11px] font-medium transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSetDeleteConfirmId(stmt.id)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                            title="Delete this statement"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 bg-slate-100/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {savedStatements.length} of {savedStatementsTotal} statements
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 rounded-xl transition flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
