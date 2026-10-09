import Link from 'next/link';
import { formatDate } from '@/lib/formatDate';
import { PrismaClient } from '@prisma/client';
import { Plus } from 'lucide-react';
import DeleteSettlementButton from '@/components/DeleteSettlementButton';
import { deleteSettlement } from './actions';

const prisma = new PrismaClient();

export default async function SettlementsPage() {
  const settlements = await prisma.settlement.findMany({
    orderBy: { createdAt: 'desc' },
    include: { worker: true }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Settlements</h1>
        <Link 
          href="/settlements/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> New Settlement
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium text-gray-600">Employee</th>
              <th className="p-4 font-medium text-gray-600">Total Amount</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600">Date</th>
              <th className="p-4 font-medium text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {settlements.map((settlement) => (
              <tr key={settlement.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-900">{settlement.worker.name}</td>
                <td className="p-4 font-bold text-gray-800">{settlement.totalPayAmount?.toFixed(2)} BDT</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    settlement.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    settlement.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {settlement.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{formatDate(settlement.createdAt)}</td>
                <td className="p-4 text-right flex items-center justify-end gap-4">
                  <Link href={`/settlements/${settlement.id}`} className="text-sm text-blue-600 hover:underline">
                    View / Print
                  </Link>
                  <Link href={`/settlements/${settlement.id}/edit`} className="text-sm text-green-600 hover:underline">
                    Edit
                  </Link>
                  <DeleteSettlementButton id={settlement.id} onDelete={deleteSettlement} />
                </td>
              </tr>
            ))}

            {settlements.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No settlements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



