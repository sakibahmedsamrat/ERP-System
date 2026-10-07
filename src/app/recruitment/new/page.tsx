import { createRecruitment } from '../actions';
import Link from 'next/link';

export default function NewRecruitmentPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Open New Job</h1>
        <Link href="/recruitment" className="text-blue-600 hover:underline">
          &larr; Back to Recruitment
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form action={createRecruitment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title / Position *
            </label>
            <input 
              type="text" 
              name="title" 
              required 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description & Requirements
            </label>
            <textarea 
              name="description" 
              rows={5}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
            >
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
