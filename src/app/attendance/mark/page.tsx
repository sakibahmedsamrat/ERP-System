import { PrismaClient } from '@prisma/client';
import { markAttendance } from '../actions';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function MarkAttendancePage({ searchParams }: { searchParams: { companyId?: string } }) {
  const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
  
  const selectedCompanyId = searchParams.companyId || '';
  
  let workers: any[] = [];
  if (selectedCompanyId) {
    workers = await prisma.worker.findMany({
      where: { 
        companyId: selectedCompanyId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mark Attendance</h1>
        <Link href="/attendance" className="text-blue-600 hover:underline">
          &larr; Back to Log
        </Link>
      </div>

      {/* Company Selection Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <form className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Company</label>
            <select 
              name="companyId" 
              defaultValue={selectedCompanyId}
              required
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Choose Company --</option>
              {companies.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 transition">
            Load Workers
          </button>
        </form>
      </div>

      {/* Attendance Form */}
      {selectedCompanyId && workers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <form action={markAttendance}>
            <input type="hidden" name="companyId" value={selectedCompanyId} />
            
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
              <label className="font-medium text-gray-700">Date:</label>
              <input 
                type="date" 
                name="date" 
                defaultValue={today}
                required
                className="border border-gray-300 rounded p-1 px-2"
              />
            </div>

            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-medium text-gray-600">Employee ID</th>
                  <th className="p-4 font-medium text-gray-600">Name</th>
                  <th className="p-4 font-medium text-gray-600 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{worker.workerId}</td>
                    <td className="p-4">{worker.name}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`status_${worker.id}`} value="PRESENT" defaultChecked className="text-green-600" />
                          <span className="text-green-700 font-medium text-sm">Present</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`status_${worker.id}`} value="ABSENT" className="text-red-600" />
                          <span className="text-red-700 font-medium text-sm">Absent</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`status_${worker.id}`} value="LATE" className="text-yellow-600" />
                          <span className="text-yellow-700 font-medium text-sm">Late</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`status_${worker.id}`} value="LEAVE" className="text-blue-600" />
                          <span className="text-blue-700 font-medium text-sm">Leave</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-gray-50 border-t border-gray-200 text-right">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 transition"
              >
                Submit Attendance
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCompanyId && workers.length === 0 && (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500">
          No active workers found in this company.
        </div>
      )}
    </div>
  );
}
