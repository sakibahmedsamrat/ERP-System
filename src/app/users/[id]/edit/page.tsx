import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditUserForm from './EditUserForm';
import { ArrowLeft, Sparkles, UserCheck } from 'lucide-react';

export const metadata = {
  title: 'Edit User Access | HR ERP',
};

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });

  if (!user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl p-8 border border-white/70 text-center text-slate-500">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Access Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit User Access</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Modify user permissions, roles, and allowed module entitlements
          </p>
        </div>
        <Link 
          href="/users" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Users
        </Link>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm">
        <EditUserForm user={user} />
      </div>
    </div>
  );
}
