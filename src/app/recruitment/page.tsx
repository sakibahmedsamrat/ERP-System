import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus } from 'lucide-react';

const prisma = new PrismaClient();

export default async function RecruitmentPage() {
  const recruitments = await prisma.recruitment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { applicants: true }
      }
    }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Recruitment</h1>
        <Link 
          href="/recruitment/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Open New Job
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recruitments.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {job.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 flex-1">{job.description}</p>
            
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">
                Applicants: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{job._count.applicants}</span>
              </span>
              <button className="text-blue-600 hover:underline">View Applicants &rarr;</button>
            </div>
          </div>
        ))}

        {recruitments.length === 0 && (
          <div className="col-span-full bg-white p-8 text-center rounded-xl shadow-sm text-gray-500">
            No active recruitment circulars.
          </div>
        )}
      </div>
    </div>
  );
}
