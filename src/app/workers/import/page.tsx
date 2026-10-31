'use client'

import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { bulkImportWorkers } from './actions';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, ArrowLeft, Upload, CheckCircle2, AlertCircle, Sparkles, Calendar, Info } from 'lucide-react';

export default function ImportWorkersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setLoading(true);
    setMessage('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.data && results.data.length > 0) {
          let hasError = false;
          let totalCount = 0;
          for (let i = 0; i < results.data.length; i += 50) {
            const chunk = results.data.slice(i, i + 50);
            const response = await bulkImportWorkers(chunk);
            if (response.error) {
              setMessage('Error in chunk ' + i + ': ' + response.error);
              hasError = true;
              break;
            }
            if (response.count) totalCount += response.count;
          }
          if (!hasError) {
            setMessage('Success! Imported ' + totalCount + ' workers.');
            setTimeout(() => {
              router.push('/workers');
            }, 2000);
          }
        } else {
          setMessage('Error: File is empty or invalid.');
        }
        setLoading(false);
      },
      error: (err: any) => {
        setMessage('Error parsing File: ' + err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            href="/workers" 
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs transition mb-2"
          >
            <ArrowLeft size={14} /> Back to Employees
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Import Employees</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Bulk upload and synchronize employee profiles from CSV format</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Download Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm border border-white/70 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-600/20 shrink-0">
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  <Sparkles size={13} />
                  <span>Standardized Import</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Download CSV Template</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                  Download our ready-to-use CSV template pre-populated with exact headers and structure to guarantee seamless bulk onboarding.
                </p>
              </div>
            </div>
            <a
              href="/api/workers/template"
              download="worker_import_template.csv"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition whitespace-nowrap"
            >
              <Download size={15} />
              Download Template
            </a>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-wider">
              Supported Columns ({18}):
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs text-slate-700">
              {[
                'Worker ID', 'Name', 'Designation', 'Department', 'Section',
                'Sub Section', 'Grade', 'Join Date (DD/MM/YY)', 'Gross Salary', 'Phone',
                'NID', 'Date of Birth (DD/MM/YY)', 'Gender', 'Blood Group', 'Father Name',
                'Mother Name', 'Address', 'Company'
              ].map(header => (
                <span key={header} className="bg-white/80 backdrop-blur-xs border border-slate-200/80 px-2.5 py-1 rounded-lg font-mono text-[11px] text-slate-800 shadow-xs">
                  {header}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Date Format Guidance Card */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-sm border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20 shrink-0 mt-0.5">
              <Calendar size={20} />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Standard Date Format: DD/MM/YY or DD/MM/YYYY</h3>
                <span className="text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dates such as <strong className="text-slate-800">Join Date</strong> and <strong className="text-slate-800">Date of Birth</strong> should be formatted as <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-700 font-mono font-semibold text-[11px]">DD/MM/YY</code> (e.g. <span className="font-semibold text-slate-800">15/08/24</span>) or <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-700 font-mono font-semibold text-[11px]">DD/MM/YYYY</code> (e.g. <span className="font-semibold text-slate-800">15/08/2024</span>). Common separators like slash (<code className="bg-white px-1 rounded text-slate-700">/</code>) and dash (<code className="bg-white px-1 rounded text-slate-700">-</code>) are fully supported.
              </p>
              <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500">
                <Info size={14} className="shrink-0 text-blue-500 mt-0.5" />
                <span>
                  Two-digit years are intelligently mapped (e.g. <span className="font-medium text-slate-700">24 &rarr; 2024</span>, birth year <span className="font-medium text-slate-700">95 &rarr; 1995</span>). Standard ISO dates (<code className="bg-white px-1 rounded text-slate-700 font-mono">YYYY-MM-DD</code>) are also accepted as fallback.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm border border-white/70">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Upload CSV File</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">
            Select a comma-separated values (.csv) file prepared according to the template above.
          </p>

          <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-8 text-center transition bg-white/50 backdrop-blur-sm">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {file && (
              <p className="mt-3 text-xs text-slate-600 font-medium">
                Selected: <span className="text-slate-900 font-bold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {message && (
            <div className={`mt-5 p-4 rounded-2xl text-xs flex items-start gap-2.5 font-semibold ${
              message.startsWith('Error') 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {message.startsWith('Error') ? (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              )}
              <div>{message}</div>
            </div>
          )}

          <div className="pt-6">
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
            >
              <Upload size={18} />
              {loading ? 'Processing Import...' : 'Upload & Import Workers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
