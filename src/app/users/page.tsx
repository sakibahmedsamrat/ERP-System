import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Shield, User, Pencil, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DeleteUserButton from './DeleteUserButton';

export default async function UsersPage() {
  const session = await getSession();
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      userId: true,
      role: true,
      modules: true,
      createdAt: true
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Security &amp; Permissions</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage administrative access, roles, and module entitlements
          </p>
        </div>
        <Link 
          href="/users/new" 
          prefetch={true}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 w-fit"
        >
          <Plus size={18} /> Add New User
        </Link>
      </div>

      <div className="glass-table-container rounded-3xl shadow-sm border border-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white/40">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 text-blue-600 border border-blue-200/60 p-2 rounded-xl">
                        <User size={16} />
                      </div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono font-medium">{u.userId}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs inline-flex items-center gap-1 ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      u.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {u.role === 'SUPER_ADMIN' && <Shield size={11} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.id === session.user.id && (
                        <span className="text-[11px] text-slate-400 italic mr-2 font-medium">Current User</span>
                      )}
                      <Link 
                        href={`/users/${u.id}/edit`}
                        prefetch={true}
                        className="text-blue-600 hover:text-blue-800 transition p-1.5 rounded-lg hover:bg-white"
                        title="Edit User"
                      >
                        <Pencil size={16} />
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
                  <td colSpan={4} className="p-10 text-center text-slate-500 font-medium">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
