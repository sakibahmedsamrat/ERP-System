'use client';

import React, { memo, useMemo } from 'react';
import {
  Search,
  Plus,
  Calendar,
  FileText,
  Printer,
  Trash2,
  Edit3,
  X,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

export interface SalaryStatementTableProps {
  statements: any[];
  statusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'ISSUED';
  onStatusFilterChange: (filter: 'ALL' | 'PENDING' | 'APPROVED' | 'ISSUED') => void;
  tableSearchQuery: string;
  onTableSearchChange: (query: string) => void;
  counts: { all: number; pending: number; approved: number; issued: number };
  onEdit: (statementId: string) => void;
  onPrint: (statementId: string) => void;
  onDelete: (statementId: string, e?: React.MouseEvent) => void;
  onStatusChange: (statementId: string, newStatus: string) => void;
  onNewStatement: () => void;
  onPreloadGenerator?: () => void;
  loadingStatementId: string | null;
  deleteConfirmId: string | null;
  onSetDeleteConfirmId: (id: string | null) => void;
  deletingId: string | null;
  normalizeStatementData: (data: any) => any;
}

export const SalaryStatementTable = memo(function SalaryStatementTable({
  statements,
  statusFilter,
  onStatusFilterChange,
  tableSearchQuery,
  onTableSearchChange,
  counts,
  onEdit,
  onPrint,
  onDelete,
  onStatusChange,
  onNewStatement,
  onPreloadGenerator,
  loadingStatementId,
  deleteConfirmId,
  onSetDeleteConfirmId,
  deletingId,
  normalizeStatementData,
}: SalaryStatementTableProps) {
  // Pre-process statements data once so filtering and searching is instantaneous
  const processedStatements = useMemo(() => {
    return (statements || [])
      .map((stmt) => {
        if (!stmt) return null;
        const raw = normalizeStatementData(stmt.data);
        const fd = typeof raw === 'object' && raw.formData ? raw.formData : raw || {};
        const currentStatus = (stmt.data?.status || raw?.status || fd.status || 'APPROVED').toUpperCase();

        const workerName = stmt.name || stmt.worker?.name || fd.name || 'Unknown Employee';
        const workerId = stmt.workerId || stmt.worker?.workerId || fd.workerId || 'N/A';
        const designationName =
          stmt.designation || stmt.worker?.designation || fd.designation || '';
        const deptName =
          stmt.department || stmt.worker?.department?.name || fd.department || 'Administration';
        const refNo = stmt.refNo || fd.refNo || 'N/A';
        const formattedDate = stmt.statementDate ? stmt.statementDate : formatDate(stmt.createdAt);

        // Total amount calculation
        const totalAmount =
          typeof fd.monthlyPayableAmount === 'number' && fd.monthlyPayableAmount > 0
            ? fd.monthlyPayableAmount
            : typeof fd.structureTotal === 'number' && fd.structureTotal > 0
            ? fd.structureTotal
            : Array.isArray(fd.months) && fd.months[2]?.netPayable
            ? Number(fd.months[2].netPayable) || 0
            : 0;

        // Salary month calculation
        const monthsArr = Array.isArray(fd.months) ? fd.months : [];
        let monthText = 'Past 3 Months';
        if (monthsArr.length === 3 && monthsArr[0]?.monthName && monthsArr[2]?.monthName) {
          const m0 = (monthsArr[0].monthName || '').split(' ')[0] || monthsArr[0].monthName;
          const m2 = (monthsArr[2].monthName || '').split(' ')[0] || monthsArr[2].monthName;
          monthText = `${m0} - ${m2}`;
        } else if (monthsArr[2]?.monthName) {
          monthText = (monthsArr[2].monthName || '').split(' ')[0] || monthsArr[2].monthName;
        }

        const purpose = (fd.purpose || raw?.purpose || '').toLowerCase();
        const searchCorpus = `${workerName} ${workerId} ${refNo} ${deptName} ${designationName} ${purpose}`.toLowerCase();

        return {
          stmt,
          id: stmt.id,
          workerName,
          workerId,
          designationName,
          deptName,
          refNo,
          formattedDate,
          totalAmount,
          monthText,
          currentStatus,
          createdAt: stmt.createdAt,
          searchCorpus,
        };
      })
      .filter(Boolean) as Array<{
        stmt: any;
        id: string;
        workerName: string;
        workerId: string;
        designationName: string;
        deptName: string;
        refNo: string;
        formattedDate: string;
        totalAmount: number;
        monthText: string;
        currentStatus: string;
        createdAt: any;
        searchCorpus: string;
      }>;
  }, [statements, normalizeStatementData]);

  // Filtered statements for Settlements-style table (instantaneous in memory)
  const filteredStatements = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    return processedStatements.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ISSUED') {
          if (item.currentStatus !== 'ISSUED' && item.currentStatus !== 'PAID') return false;
        } else if (item.currentStatus !== statusFilter) {
          return false;
        }
      }
      // Table search query
      if (q && !item.searchCorpus.includes(q)) {
        return false;
      }
      return true;
    });
  }, [processedStatements, statusFilter, tableSearchQuery]);

  return (
    <div className="space-y-6 print:hidden">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Controls: Filter Tabs & Search */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll">
            <button
              type="button"
              onClick={() => onStatusFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>All Statements</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Pending</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange('APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Approved</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {counts.approved}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange('ISSUED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'ISSUED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Issued</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'ISSUED' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
                }`}
              >
                {counts.issued}
              </span>
            </button>
          </div>

          {/* Search within table */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name, ID, ref no, or dept..."
              value={tableSearchQuery}
              onChange={(e) => onTableSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {tableSearchQuery && (
              <button
                type="button"
                onClick={() => onTableSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar touch-scroll">
          <table className="w-full text-left border-collapse text-xs min-w-[720px]">
            <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70">
              <tr>
                <th className="p-4 font-bold text-xs text-slate-600 uppercase tracking-wider">Employee</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Type / Dates</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Salary Month</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStatements.map((item) => {
                const {
                  stmt,
                  id,
                  workerName,
                  workerId,
                  designationName,
                  deptName,
                  refNo,
                  formattedDate,
                  totalAmount,
                  monthText,
                  currentStatus,
                  createdAt,
                } = item;

                return (
                  <tr
                    key={id}
                    onClick={() => onEdit(id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition group"
                  >
                    {/* Employee Info */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-1.5 flex-wrap">
                        {workerName}
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                          Statement
                        </span>
                        {currentStatus === 'PENDING' && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        ID: {workerId}
                        {designationName && (
                          <span className="font-sans text-gray-500"> &bull; {designationName}</span>
                        )}
                        {deptName && (
                          <span className="font-sans text-gray-400"> &bull; {deptName}</span>
                        )}
                      </div>
                    </td>

                    {/* Type / Dates */}
                    <td className="p-4">
                      <div className="text-xs space-y-0.5">
                        <div className="text-gray-800 font-mono font-medium">
                          Ref: {refNo}
                        </div>
                        <div className="text-gray-500">
                          <span className="text-gray-400">Date:</span> {formattedDate}
                        </div>
                      </div>
                    </td>

                    {/* Salary Month */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-800">
                        <Calendar size={13} className="text-indigo-600 shrink-0" />
                        <span>{monthText}</span>
                      </span>
                    </td>

                    {/* Total Amount (2-line layout matching Settlements) */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900 text-sm leading-tight">
                        {totalAmount.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold text-gray-900 leading-tight">
                        BDT
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={currentStatus}
                        onChange={(e) => onStatusChange(id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                          currentStatus === 'APPROVED'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : currentStatus === 'ISSUED' || currentStatus === 'PAID'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}
                      >
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="ISSUED">ISSUED</option>
                        <option value="PAID">PAID</option>
                      </select>
                    </td>

                    {/* Date Created */}
                    <td className="p-4 text-xs text-gray-500 font-medium">
                      {formatDate(createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onMouseEnter={onPreloadGenerator}
                          onClick={() => onEdit(id)}
                          className="text-xs font-bold text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          onMouseEnter={onPreloadGenerator}
                          onClick={() => onPrint(id)}
                          disabled={loadingStatementId === id}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                          title="Print statement certificate"
                        >
                          {loadingStatementId === id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Printer size={13} />
                          )}
                          <span>Print</span>
                        </button>

                        {deleteConfirmId === id ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5">
                            <span className="text-[11px] text-rose-700 font-bold px-1">Delete?</span>
                            <button
                              type="button"
                              onClick={(e) => onDelete(id, e)}
                              disabled={deletingId === id}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[11px] font-bold transition disabled:opacity-50"
                            >
                              {deletingId === id ? '...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetDeleteConfirmId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[11px] font-medium transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSetDeleteConfirmId(id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                            title="Delete statement"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStatements.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No salary statements found.</p>
                      <p className="text-xs text-gray-400">
                        {tableSearchQuery
                          ? 'Try adjusting your search query.'
                          : 'Use "New Statement" above or start the generator to create your first statement.'}
                      </p>
                      <button
                        type="button"
                        onMouseEnter={onPreloadGenerator}
                        onClick={onNewStatement}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition mt-2 flex items-center gap-1.5"
                      >
                        <Plus size={15} /> Create New Statement
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
