import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus, User, Building2, Trash2, Search, Download, Upload } from 'lucide-react';
import { deleteWorker } from './actions';
import DeleteWorkerButton from '@/components/DeleteWorkerButton';

const prisma = new PrismaClient();

export default async function WorkersPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';

  const workers = await prisma.worker.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { workerId: { contains: query } },
        { phone: { contains: query } },
        { department: { name: { contains: query } } },
        { designation: { contains: query } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { company: true }
  });

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        
        <div className="flex gap-2">
          {/* We'll handle CSV upload/download via a separate page or API in the future, for now placeholder buttons */}
          <Link href="/api/workers/export" className="bg-green-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition text-sm">
            <Download size={16} /> Export CSV
          </Link>
          <Link href="/workers/import" className="bg-purple-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-purple-700 transition text-sm">
            <Upload size={16} /> Import CSV
          </Link>
          <Link href="/workers/new" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition text-sm">
            <Plus size={16} /> Add Employee
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-4">
        <form className="flex gap-2 w-full max-w-lg">
          <input 
            type="text" 
            name="q" 
            defaultValue={query} 
            placeholder="Search by ID, Name, Phone, Dept, Designation..." 
            className="flex-1 border border-gray-300 rounded p-2 outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition flex items-center gap-2">
            <Search size={16} /> Search
          </button>
          {query && (
            <Link href="/workers" className="px-4 py-2 text-red-600 hover:bg-red-50 rounded">Clear</Link>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium text-gray-600">ID</th>
              <th className="p-4 font-medium text-gray-600">Name</th>
              <th className="p-4 font-medium text-gray-600">Company</th>
              <th className="p-4 font-medium text-gray-600">Designation</th>
              <th className="p-4 font-medium text-gray-600">Phone</th>
              <th className="p-4 font-medium text-gray-600">Blood</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workers.map((worker) => (
              <tr key={worker.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-900">{worker.workerId}</td>
                <td className="p-4 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {worker.name}
                </td>
                <td className="p-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    {worker.company.name}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{worker.designation || '-'}</td>
                <td className="p-4 text-gray-600">{worker.phone || '-'}</td>
                <td className="p-4 text-gray-600">{worker.bloodGroup || '-'}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <Link 
                    href={`/workers/${worker.id}/id-card`} 
                    className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded transition"
                    target="_blank"
                  >
                    ID Card
                  </Link>
                  <Link 
                    href={`/workers/${worker.id}/edit`} 
                    className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded transition"
                  >
                    Edit
                  </Link>
                  <DeleteWorkerButton id={worker.id} onDelete={deleteWorker} />
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No workers found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
