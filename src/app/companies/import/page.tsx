'use client'

import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { bulkImportHierarchy } from './actions';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Download, FileSpreadsheet, Loader2, Sparkles, UploadCloud } from 'lucide-react';

export default function ImportCompanyHierarchyPage() {
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
          for (let i = 0; i < results.data.length; i += 100) {
            const chunk = results.data.slice(i, i + 100);
            const response = await bulkImportHierarchy(chunk);
            if (response.error) {
              setMessage('Error: ' + response.error);
              hasError = true;
              break;
            }
          }
          if (!hasError) {
            setMessage('Success! Imported structure from Excel/CSV.');
            setTimeout(() => {
              router.push('/companies');
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
            href="/companies" 
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs transition mb-2"
          >
            <ArrowLeft size={14} /> Back to Companies
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Import Company Structure</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Bulk upload companies, departments, sections, and sub-sections from CSV format
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Download Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm border border-white/70 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-purple-600/20 shrink-0">
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Download Template</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
                  Ensure your file matches the exact header format: <span className="font-mono text-slate-700 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">Company, Department, Section, Sub Section</span>
                </p>
              </div>
            </div>
            <a 
              href="/api/companies/template" 
              className="bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-2 shrink-0 hover:border-slate-300"
            >
              <Download size={15} className="text-purple-600" />
              <span>Download CSV Template</span>
            </a>
          </div>
        </div>

        {/* Upload File Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm border border-white/70 space-y-6">
          <div className="border-2 border-dashed border-slate-200/80 hover:border-purple-500/50 rounded-2xl p-8 sm:p-12 text-center bg-white/40 hover:bg-white/60 transition-all flex flex-col items-center justify-center group cursor-pointer relative">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud size={28} />
            </div>
            <span className="font-bold text-sm text-slate-800 mb-1">Select CSV File to Upload</span>
            <span className="text-xs text-slate-400">Supported format: .csv</span>
            
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {file && (
              <div className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200/70 shadow-xs">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
              message.startsWith('Error') ? 'bg-rose-50/80 text-rose-700 border-rose-200' : 'bg-emerald-50/80 text-emerald-700 border-emerald-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${message.startsWith('Error') ? 'bg-rose-600' : 'bg-emerald-600'}`} />
              <span>{message}</span>
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-purple-600/20 w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing CSV Data...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Upload &amp; Import Structure</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
