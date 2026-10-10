import { createTraining } from '../actions';
import Link from 'next/link';
import EmployeeSelect from '@/components/EmployeeSelect';

export default function NewTrainingPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Schedule Training</h1>
        <Link href="/training" className="text-blue-600 hover:underline">
          &larr; Back to Training
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form action={createTraining} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Training Title *
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
              Description
            </label>
            <textarea 
              name="description" 
              rows={3}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time *
            </label>
            <input 
              type="datetime-local" 
              name="date" 
              required 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input 
              type="text" 
              name="location" 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trainer (Search by Name or ID)
            </label>
            <EmployeeSelect mode="single" inputName="trainerId" placeholder="Search Trainer..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Employees
            </label>
            <EmployeeSelect />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


