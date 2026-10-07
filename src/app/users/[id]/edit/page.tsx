import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { updateUser } from '../../actions';
import EditUserForm from './EditUserForm';

const prisma = new PrismaClient();

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit User Access</h1>
        <Link href="/users" className="text-blue-600 hover:underline">
          &larr; Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <EditUserForm user={user} />
      </div>
    </div>
  );
}
