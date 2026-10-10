import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { formatDateTime } from '@/lib/formatDate';
import { Plus, MapPin, Calendar, Eye, Edit, Trash2, Users } from 'lucide-react';
import DeleteTrainingButton from './DeleteTrainingButton';

const prisma = new PrismaClient();

export default async function TrainingPage() {
  const [trainings, totalWorkers] = await Promise.all([
    prisma.training.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    }),
    prisma.worker.count()
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Training Schedules</h1>
        <Link 
          href="/training/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Schedule Training
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings.map((training) => (
          <div key={training.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-800">{training.title}</h2>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold ${
                  training.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  training.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {training.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{training.description || 'No description provided.'}</p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Users size={15} className="text-blue-500" />
                  <span>{training._count.workers} / {totalWorkers} Participants</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" /> {formatDateTime(training.date)}
                </span>
                {training.location && (
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" /> {training.location}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
              <Link 
                href={`/training/${training.id}`}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm transition"
              >
                <Eye size={16} /> View Details
              </Link>
              
              <div className="flex items-center gap-3">
                <Link 
                  href={`/training/${training.id}/edit`}
                  className="text-gray-500 hover:text-orange-500 transition"
                  title="Edit Training"
                >
                  <Edit size={16} />
                </Link>
                <DeleteTrainingButton id={training.id} />
              </div>
            </div>
          </div>
        ))}

        {trainings.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <Users size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Training Scheduled</h3>
            <p className="text-gray-500 mb-6">Create your first training schedule to assign employees.</p>
            <Link 
              href="/training/new" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Schedule Training
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


