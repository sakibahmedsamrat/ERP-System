import { getSession } from '@/lib/auth';
import { Settings, Lock } from 'lucide-react';
import { changePassword } from './actions';
import PasswordChangeForm from './PasswordChangeForm';
import ProfileImageUpload from './ProfileImageUpload';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function SettingsPage() {
  const session = await getSession();
  
  let profileImage = null;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (dbUser) profileImage = dbUser.profileImage;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <Settings size={28} className="text-gray-700" />
        <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <ProfileImageUpload currentImage={profileImage} />
        
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <UserIcon /> Profile Information
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block mb-1">Name</span>
            <span className="font-medium text-gray-800 text-base">{session?.user?.name}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">User ID</span>
            <span className="font-medium text-gray-800 text-base">{session?.user?.userId || session?.user?.email}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Role</span>
            <span className="font-medium text-gray-800 text-base">{session?.user?.role}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Lock size={20} /> Change Password
        </h2>
        <PasswordChangeForm />
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
