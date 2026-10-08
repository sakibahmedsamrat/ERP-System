import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function ActivityLogsPage() {
  const session = await getSession();
  if (!session || !session.user) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Activity Logs</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Date & Time</th>
              <th className="p-4 font-semibold text-gray-600">Creator Name</th>
              <th className="p-4 font-semibold text-gray-600">Creator ID</th>
              <th className="p-4 font-semibold text-gray-600">Module</th>
              <th className="p-4 font-semibold text-gray-600">Action</th>
              <th className="p-4 font-semibold text-gray-600">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-4 text-sm text-gray-800 font-medium">{log.userName}</td>
                <td className="p-4 text-sm text-gray-500">{log.userId}</td>
                <td className="p-4 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold uppercase">{log.module}</span>
                </td>
                <td className="p-4 text-sm">
                  <span className={'px-2 py-1 rounded text-xs font-semibold uppercase ' + (log.action === 'CREATE' ? 'bg-green-100 text-green-800' : log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No activity logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
