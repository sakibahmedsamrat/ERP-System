'use client';

import React, { useState, memo } from 'react';
import { RotateCcw } from 'lucide-react';

// ==========================================
// 1. EditableLabelCell
// ==========================================
export interface EditableLabelCellProps {
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
  onReset?: () => void;
  highlight?: boolean;
  isBold?: boolean;
  align?: 'left' | 'right' | 'center';
}

export const EditableLabelCell = memo(function EditableLabelCell({
  value,
  defaultValue,
  onChange,
  onReset,
  highlight = false,
  isBold = false,
  align = 'left',
}: EditableLabelCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState('');

  const displayVal = value || defaultValue;
  const isModified = displayVal !== defaultValue;

  const startEditing = () => {
    setTempVal(displayVal);
    setIsEditing(true);
  };

  return (
    <div
      className={`relative group/cell flex items-center w-full min-h-[20px] px-1 py-0.5 rounded transition ${
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-between'
      } ${
        highlight
          ? 'custom-row-highlight bg-rose-50/40 hover:bg-rose-100/50 print:bg-transparent border-l-2 border-rose-400 print:border-l-0'
          : 'hover:bg-blue-50/50 print:hover:bg-transparent'
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={tempVal}
          onChange={(e) => {
            setTempVal(e.target.value);
            onChange(e.target.value);
          }}
          onBlur={() => {
            setIsEditing(false);
            if (!tempVal.trim()) {
              onChange(defaultValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
            } else if (e.key === 'Escape') {
              setTempVal(displayVal);
              setIsEditing(false);
            }
          }}
          className={`w-full bg-white border border-blue-500 rounded px-1 py-0.5 text-xs outline-none text-slate-900 shadow-inner ${
            isBold ? 'font-bold' : ''
          }`}
        />
      ) : (
        <span
          onClick={startEditing}
          className={`cursor-pointer flex-1 whitespace-nowrap overflow-visible select-none text-black ${
            isBold ? 'font-bold' : ''
          }`}
          title={highlight ? 'Customizable particulars label - Click to edit' : 'Click to edit label directly'}
        >
          {displayVal}
        </span>
      )}

      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setTempVal(defaultValue);
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden p-0.5 rounded transition ml-1 shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title={`Reset label to "${defaultValue}"`}
        >
          <RotateCcw size={10} />
        </button>
      )}
    </div>
  );
});

// ==========================================
// 2. EditableAmountCell
// ==========================================
export interface EditableAmountCellProps {
  value: number;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
  suffix?: string;
  isBold?: boolean;
  decimals?: number;
}

export const EditableAmountCell = memo(function EditableAmountCell({
  value,
  onChange,
  onReset,
  defaultValue,
  suffix = '/-',
  isBold = false,
  decimals = 0,
}: EditableAmountCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState('');

  const formatted =
    decimals > 0
      ? Number(value || 0).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Number(value || 0).toLocaleString('en-US');

  const isModified =
    defaultValue !== undefined &&
    Math.round(Number(value || 0)) !== Math.round(Number(defaultValue || 0));

  const startEditing = () => {
    setTempVal(String(value ?? 0));
    setIsEditing(true);
  };

  return (
    <div className="relative group/amount flex items-center justify-end w-full min-h-[20px] px-1 py-0.5 rounded hover:bg-blue-50/50 print:hover:bg-transparent transition">
      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden p-0.5 rounded transition mr-auto shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/amount:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title="Reset amount to default"
        >
          <RotateCcw size={10} />
        </button>
      )}

      {isEditing ? (
        <div className="flex items-center justify-end w-full max-w-[85px]">
          <input
            type="text"
            autoFocus
            value={tempVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              setTempVal(raw);
              const num = parseFloat(raw);
              onChange(isNaN(num) ? 0 : num);
            }}
            onBlur={() => {
              setIsEditing(false);
              const num = parseFloat(tempVal.replace(/[^0-9.]/g, ''));
              onChange(isNaN(num) ? 0 : num);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setTempVal(String(value ?? 0));
                setIsEditing(false);
              }
            }}
            className={`w-full text-right bg-white border border-blue-500 rounded px-1 py-0.5 text-xs outline-none text-slate-900 shadow-inner ${
              isBold ? 'font-bold' : ''
            }`}
          />
          {suffix && <span className="ml-0.5 text-black shrink-0">{suffix}</span>}
        </div>
      ) : (
        <span
          onClick={startEditing}
          className={`cursor-pointer select-none text-black whitespace-nowrap overflow-visible ${
            isBold ? 'font-bold' : ''
          }`}
          title="Click to edit amount directly"
        >
          {formatted}
          {suffix}
        </span>
      )}
    </div>
  );
});

// ==========================================
// 3. EditableInlineAmount
// ==========================================
export interface EditableInlineAmountProps {
  value: number;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
  suffix?: string;
  isBold?: boolean;
  decimals?: number;
  className?: string;
}

export const EditableInlineAmount = memo(function EditableInlineAmount({
  value,
  onChange,
  onReset,
  defaultValue,
  suffix = '/-',
  isBold = false,
  decimals = 0,
  className = '',
}: EditableInlineAmountProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState('');

  const formatted =
    decimals > 0
      ? Number(value || 0).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Number(value || 0).toLocaleString('en-US');

  const isModified =
    defaultValue !== undefined &&
    Math.round(Number(value || 0)) !== Math.round(Number(defaultValue || 0));

  const startEditing = () => {
    setTempVal(String(value ?? 0));
    setIsEditing(true);
  };

  return (
    <span
      className={`relative inline group/inline-amt px-0.5 rounded hover:bg-blue-50/60 print:hover:bg-transparent transition align-baseline ${className}`}
    >
      {isEditing ? (
        <span className="inline-flex items-center align-baseline">
          <input
            type="text"
            autoFocus
            value={tempVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              setTempVal(raw);
              const num = parseFloat(raw);
              onChange(isNaN(num) ? 0 : num);
            }}
            onBlur={() => {
              setIsEditing(false);
              const num = parseFloat(tempVal.replace(/[^0-9.]/g, ''));
              onChange(isNaN(num) ? 0 : num);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setTempVal(String(value ?? 0));
                setIsEditing(false);
              }
            }}
            style={{ width: `${Math.max(5, tempVal.length + 2)}ch` }}
            className={`bg-white border border-blue-500 rounded px-1 py-0.5 text-inherit outline-none shadow-xs text-slate-900 ${
              isBold ? 'font-bold' : ''
            }`}
          />
          {suffix && <span className="ml-0.5 text-black shrink-0">{suffix}</span>}
        </span>
      ) : (
        <span
          onClick={startEditing}
          className={`cursor-pointer select-none text-black whitespace-nowrap overflow-visible ${
            isBold ? 'font-bold' : ''
          }`}
          title="Click to edit amount directly"
        >
          {formatted}
          {suffix}
        </span>
      )}

      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden inline-flex items-center align-middle p-0.5 rounded transition ml-1 shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/inline-amt:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title="Reset amount to default"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </span>
  );
});

// ==========================================
// 4. EditableInlineText
// ==========================================
export interface EditableInlineTextProps {
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
  onReset?: () => void;
  isBold?: boolean;
  isUnderline?: boolean;
  isMono?: boolean;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  renderDisplay?: (val: string) => React.ReactNode;
}

export const EditableInlineText = memo(function EditableInlineText({
  value,
  defaultValue,
  onChange,
  onReset,
  isBold = false,
  isUnderline = false,
  isMono = false,
  placeholder = 'Click to edit...',
  className = '',
  multiline = false,
  renderDisplay,
}: EditableInlineTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState('');

  const displayVal = value || defaultValue;
  const isModified = displayVal !== defaultValue;

  const startEditing = () => {
    setTempVal(displayVal);
    setIsEditing(true);
  };

  if (multiline) {
    return (
      <div
        className={`relative group/multi w-full rounded p-1 hover:bg-blue-50/50 print:hover:bg-transparent transition ${className}`}
      >
        {isEditing ? (
          <div className="w-full space-y-1">
            <textarea
              autoFocus
              rows={3}
              value={tempVal}
              placeholder={placeholder}
              onChange={(e) => {
                setTempVal(e.target.value);
                onChange(e.target.value);
              }}
              onBlur={() => {
                setIsEditing(false);
                if (!tempVal.trim() && defaultValue) {
                  onChange(defaultValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTempVal(displayVal);
                  setIsEditing(false);
                }
              }}
              className="w-full bg-white border border-blue-500 rounded p-1.5 text-xs outline-none text-slate-900 shadow-inner leading-relaxed"
            />
            <div className="flex justify-end gap-1 text-[10px] print:hidden">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsEditing(false)}
                className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={startEditing}
            className="cursor-pointer text-justify leading-relaxed"
            title="Click to edit text directly on sheet"
          >
            {renderDisplay ? renderDisplay(displayVal) : displayVal}
          </div>
        )}

        {onReset && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onReset();
              setTempVal(defaultValue);
              setIsEditing(false);
            }}
            className={`sheet-reset-btn print:hidden absolute top-1 right-1 p-1 rounded transition shadow-xs ${
              isModified
                ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 opacity-90'
                : 'opacity-0 group-hover/multi:opacity-100 text-slate-400 hover:text-blue-600 bg-white/90 border border-slate-200'
            }`}
            title="Reset text to default"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>
    );
  }

  return (
    <span
      className={`relative inline group/inline px-0.5 rounded hover:bg-blue-50/60 print:hover:bg-transparent transition align-baseline ${className}`}
    >
      {isEditing ? (
        <span className="inline-flex items-center align-baseline">
          <input
            type="text"
            autoFocus
            value={tempVal}
            placeholder={placeholder}
            onChange={(e) => {
              setTempVal(e.target.value);
              onChange(e.target.value);
            }}
            onBlur={() => {
              setIsEditing(false);
              if (!tempVal.trim() && defaultValue) {
                onChange(defaultValue);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setTempVal(displayVal);
                setIsEditing(false);
              }
            }}
            className={`bg-white border border-blue-500 rounded px-1.5 py-0.5 text-inherit outline-none shadow-xs text-slate-900 max-w-full ${
              isBold ? 'font-bold' : ''
            } ${isMono ? 'font-mono' : ''}`}
            style={{ width: `${Math.min(50, Math.max(6, tempVal.length + 2))}ch` }}
          />
        </span>
      ) : (
        <span
          onClick={startEditing}
          className={`cursor-pointer ${isBold ? 'font-bold' : ''} ${
            isUnderline ? 'salary-doc-title-underline inline-block' : ''
          } ${isMono ? 'font-mono' : ''}`}
          title="Click to edit directly on sheet"
        >
          {renderDisplay ? renderDisplay(displayVal) : displayVal}
        </span>
      )}

      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setTempVal(defaultValue);
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden inline-flex items-center align-middle p-0.5 rounded transition ml-1 shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/inline:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title="Reset text to default"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </span>
  );
});
