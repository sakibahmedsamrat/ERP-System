import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { updateCompany } from '../../actions';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied. Only Super Admin can edit companies.</div>;
  }
  const company = await prisma.company.findUnique({ where: { id: params.id } });

  if (!company) {
    return <div className="p-8">Company not found.</div>;
  }

  const updateAction = updateCompany.bind(null, company.id);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Company</h1>
        <Link href="/companies" className="text-blue-600 hover:underline">
          &larr; Back to Companies
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form action={updateAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name (কোম্পানির নাম) *
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              defaultValue={company.name}
              required 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location / Address (ঠিকানা)
            </label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              defaultValue={company.location || ''}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
            >
              Update Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

