import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Settings, Lock, UserCircle, Sparkles } from 'lucide-react';
import PasswordChangeForm from './PasswordChangeForm';
import ProfileImageUpload from './ProfileImageUpload';

export default async function SettingsPage() {
  const session = await getSession();
  
  let profileImage = null;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (dbUser) profileImage = dbUser.profileImage;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          <Sparkles size={13} />
          <span>User Preferences</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-200/50">
            <Settings size={22} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/70 shadow-sm">
        <ProfileImageUpload currentImage={profileImage} />
        
        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200/60 pb-2.5 flex items-center gap-2">
          <UserCircle size={20} className="text-blue-600" />
          <span>Profile Information</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-500 block font-semibold mb-1 uppercase tracking-wider text-[10px]">Name</span>
            <span className="font-bold text-slate-900 text-sm">{session?.user?.name}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-500 block font-semibold mb-1 uppercase tracking-wider text-[10px]">User ID</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{session?.user?.userId || session?.user?.email}</span>
          </div>
          <div className="bg-white/60 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 sm:col-span-2">
            <span className="text-slate-500 block font-semibold mb-1 uppercase tracking-wider text-[10px]">Role</span>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {session?.user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/70 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200/60 pb-2.5 flex items-center gap-2">
          <Lock size={19} className="text-indigo-600" />
          <span>Change Password</span>
        </h2>
        <PasswordChangeForm />
      </div>
    </div>
  );
}
