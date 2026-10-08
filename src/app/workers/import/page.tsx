'use client'

import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { bulkImportWorkers } from './actions';
import { useRouter } from 'next/navigation';

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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Import Workers</h1>
        <Link href="/workers" className="text-blue-600 hover:underline">
          &larr; Back to Workers
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <p className="text-gray-600 mb-4">
          Upload an Excel/CSV file to bulk create worker profiles.
        </p>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded mb-6 text-sm flex justify-between items-center">
          <div className="font-mono">
            Important headers:<br />
            Worker ID, Name, Designation, Department, Section, Sub Section, Grade, Join Date
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {message && (
          <div className={'mt-4 p-3 rounded text-sm font-bold ' + (message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
            {message}
          </div>
        )}

        <div className="pt-6">
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-full disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
