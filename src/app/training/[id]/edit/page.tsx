import { editTraining } from '@/app/training/actions';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import EmployeeSelect from '@/components/EmployeeSelect';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function EditTrainingPage({ params }: { params: { id: string } }) {
  const training = await prisma.training.findUnique({
    where: { id: params.id },
    include: { workers: true }
  });

  if (!training) {
    notFound();
  }

  // format date for datetime-local
  const dateObj = new Date(training.date);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);

  const updateAction = editTraining.bind(null, training.id);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Training</h1>
        <Link href="/training" className="text-blue-600 hover:underline">
          &larr; Back to Training
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form action={updateAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Training Title *
            </label>
            <input 
              type="text" 
              name="title" 
              defaultValue={training.title}
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
              defaultValue={training.description || ''}
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
              defaultValue={localISOTime}
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
              defaultValue={training.location || ''}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Employees
            </label>
            <EmployeeSelect initialSelected={training.workers} />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
            >
              Update Training
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
