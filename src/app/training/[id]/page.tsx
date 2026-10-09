import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { formatDateTime } from '@/lib/formatDate';
import { notFound } from 'next/navigation';
import { Users, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';

const prisma = new PrismaClient();

export default async function TrainingDetailsPage({ params }: { params: { id: string } }) {
  const training = await prisma.training.findUnique({
    where: { id: params.id },
    include: {
      workers: {
        include: {
          department: true,
          designation: true
        }
      }
    }
  });

  if (!training) notFound();

  const totalWorkers = await prisma.worker.count();
  const participantCount = training.workers.length;
  const percentage = totalWorkers > 0 ? Math.round((participantCount / totalWorkers) * 100) : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Training Details</h1>
        <Link href="/training" className="text-blue-600 hover:underline">
          &larr; Back to Trainings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">{training.title}</h2>
          <p className="text-gray-600 mb-6">{training.description || 'No description provided.'}</p>
          
          <div className="flex flex-wrap gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-500" size={18} />
              <span className="font-medium">{formatDateTime(training.date)}</span>
            </div>
            {training.location && (
              <div className="flex items-center gap-2">
                <MapPin className="text-blue-500" size={18} />
                <span className="font-medium">{training.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {training.status === 'COMPLETED' ? (
                <CheckCircle className="text-green-500" size={18} />
              ) : (
                <Clock className="text-orange-500" size={18} />
              )}
              <span className="font-medium">{training.status}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md p-6 flex flex-col justify-center items-center text-center">
          <Users size={40} className="mb-3 opacity-80" />
          <div className="text-4xl font-bold mb-1">{participantCount} <span className="text-xl text-blue-200">/ {totalWorkers}</span></div>
          <div className="text-sm text-blue-100 mb-3">Employees Participating</div>
          
          <div className="w-full bg-blue-900/50 rounded-full h-2 mb-1">
            <div className="bg-white h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="text-xs font-medium text-blue-200">{percentage}% of total workforce</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Participant List ({participantCount})</h3>
        </div>
        
        {participantCount === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No employees have been assigned to this training yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Employee</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Card No</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Designation</th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">Department</th>
                </tr>
              </thead>
              <tbody>
                {training.workers.map((worker: any) => (
                  <tr key={worker.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{worker.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{worker.workerId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{worker.designation || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{worker.department?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

