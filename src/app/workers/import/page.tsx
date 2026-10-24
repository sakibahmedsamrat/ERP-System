'use client'

import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { bulkImportWorkers } from './actions';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Import Workers</h1>
          <p className="text-gray-500 text-sm mt-1">Bulk upload and synchronize employee profiles from CSV</p>
        </div>
        <Link 
          href="/workers" 
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm transition"
        >
          <ArrowLeft size={16} /> Back to Workers
        </Link>
      </div>

      <div className="space-y-6">
        {/* Template Download Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-blue-950">Download CSV Template</h2>
                <p className="text-xs text-blue-700 mt-1 max-w-md">
                  Download our ready-to-use CSV template pre-populated with the exact headers and sample data to ensure error-free imports.
                </p>
              </div>
            </div>
            <a
              href="/api/workers/template"
              download="worker_import_template.csv"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition whitespace-nowrap"
            >
              <Download size={16} />
              Download Template
            </a>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200/60">
            <div className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
              Supported Columns:
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs text-blue-800">
              {[
                'Worker ID', 'Name', 'Designation', 'Department', 'Section',
                'Sub Section', 'Grade', 'Join Date', 'Gross Salary', 'Phone',
                'NID', 'Date of Birth', 'Gender', 'Blood Group', 'Father Name',
                'Mother Name', 'Address', 'Company'
              ].map(header => (
                <span key={header} className="bg-white/80 border border-blue-200 px-2 py-0.5 rounded font-mono text-[11px]">
                  {header}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Upload CSV File</h2>
          <p className="text-gray-500 text-sm mb-5">
            Select a comma-separated values (.csv) file prepared according to the template above.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition bg-gray-50/50">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {file && (
              <p className="mt-3 text-xs text-gray-500 font-medium">
                Selected: <span className="text-gray-800 font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {message && (
            <div className={`mt-5 p-4 rounded-xl text-sm flex items-start gap-2.5 font-medium ${
              message.startsWith('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.startsWith('Error') ? (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              )}
              <div>{message}</div>
            </div>
          )}

          <div className="pt-6">
            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
