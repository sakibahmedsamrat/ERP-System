import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus, MapPin, Calendar } from 'lucide-react';

const prisma = new PrismaClient();

export default async function TrainingPage() {
  const trainings = await prisma.training.findMany({
    orderBy: { date: 'asc' }
  });

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainings.map((training) => (
          <div key={training.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-800">{training.title}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                training.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                training.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {training.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 flex-1">{training.description}</p>
            
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Calendar size={16} /> {new Date(training.date).toLocaleString()}
              </span>
              {training.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> {training.location}
                </span>
              )}
            </div>
          </div>
        ))}

        {trainings.length === 0 && (
          <div className="col-span-full bg-white p-8 text-center rounded-xl shadow-sm text-gray-500">
            No training scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
