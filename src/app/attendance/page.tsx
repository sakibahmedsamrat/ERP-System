import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { ClipboardCheck } from 'lucide-react';

const prisma = new PrismaClient();

export default async function AttendancePage({ searchParams }: { searchParams: { date?: string } }) {
  const dateStr = searchParams.date || new Date().toISOString().split('T')[0];
  
  const startOfDay = new Date(dateStr);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateStr);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    include: {
      worker: {
        include: { company: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Attendance (হাজিরা)</h1>
        <Link 
          href="/attendance/mark" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <ClipboardCheck size={20} /> Mark Attendance
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-4 flex gap-4 items-end">
        <form className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input 
              type="date" 
              name="date" 
              defaultValue={dateStr}
              className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium text-gray-600">Employee ID</th>
              <th className="p-4 font-medium text-gray-600">Name</th>
              <th className="p-4 font-medium text-gray-600">Company</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendances.map((record) => {
              let statusColor = "bg-gray-100 text-gray-800";
              if (record.status === "PRESENT") statusColor = "bg-green-100 text-green-800";
              if (record.status === "ABSENT") statusColor = "bg-red-100 text-red-800";
              if (record.status === "LATE") statusColor = "bg-yellow-100 text-yellow-800";
              if (record.status === "LEAVE") statusColor = "bg-blue-100 text-blue-800";

              return (
                <tr key={record.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-900">{record.worker.workerId}</td>
                  <td className="p-4">{record.worker.name}</td>
                  <td className="p-4 text-gray-600">{record.worker.company.name}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${statusColor}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              )
            })}

            {attendances.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No attendance records found for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
