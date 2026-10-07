import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Plus, Shield, User, Pencil } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DeleteUserButton from './DeleteUserButton';
import { deleteUser } from './actions';

const prisma = new PrismaClient();

export default async function UsersPage() {
  const session = await getSession();
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <Link 
          href="/users/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Add New User
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <th className="p-4 font-semibold text-sm">Name</th>
              <th className="p-4 font-semibold text-sm">User ID</th>
              <th className="p-4 font-semibold text-sm">Role</th>
              <th className="p-4 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                      <User size={18} />
                    </div>
                    <span className="font-medium text-gray-800">{u.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{u.userId}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max ${
                    u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 
                    u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role === 'SUPER_ADMIN' && <Shield size={12} />}
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {u.id === session.user.id && (
                      <span className="text-xs text-gray-400 italic mr-2">Current User</span>
                    )}
                    <Link 
                      href={`/users/${u.id}/edit`}
                      className="text-blue-500 hover:text-blue-700 transition px-2 py-1"
                      title="Edit User"
                    >
                      <Pencil size={18} />
                    </Link>
                    {u.id !== session.user.id && u.role !== 'SUPER_ADMIN' && (
                      <div className="w-8">
                        <DeleteUserButton id={u.id} />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
