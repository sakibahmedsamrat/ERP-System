import { updateWorker } from '../../actions';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import DynamicCompanySelectors from '@/components/DynamicCompanySelectors';
import SalaryFields from '../../new/SalaryFields';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function EditWorkerPage({ params }: { params: { id: string } }) {
  const worker = await prisma.worker.findUnique({
    where: { id: params.id }
  });

  if (!worker) {
    return notFound();
  }

  const companies = await prisma.company.findMany({ 
    orderBy: { name: 'asc' },
    include: {
      departments: {
        include: {
          sections: {
            include: { subSections: true }
          }
        }
      }
    }
  });

  const updateAction = updateWorker.bind(null, worker.id);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Employee</h1>
        <Link href="/workers" className="text-blue-600 hover:underline">
          &larr; Back to Employees
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <form action={updateAction} className="space-y-6" encType="multipart/form-data">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                <input type="text" name="workerId" defaultValue={worker.workerId} required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" defaultValue={worker.name} required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" defaultValue={worker.gender || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select name="bloodGroup" defaultValue={worker.bloodGroup || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500">
                  <option value="">Select</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                <select name="religion" defaultValue={worker.religion || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500">
                  <option value="">Select</option>
                  <option value="Islam">Islam</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Buddhism">Buddhism</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID (NID)</label>
                <input type="text" name="nationalId" defaultValue={worker.nationalId || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Files */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Photo {worker.photoUrl && <span className="text-blue-500 text-xs">(Existing photo saved)</span>}</label>
                <input type="file" name="photo" accept="image/*" className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature {worker.signatureUrl && <span className="text-blue-500 text-xs">(Existing signature saved)</span>}</label>
                <input type="file" name="signature" accept="image/*" className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input type="text" name="phone" defaultValue={worker.phone || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Present Address</label>
                <textarea name="address" rows={2} defaultValue={worker.address || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                <textarea name="permanentAddress" rows={2} defaultValue={worker.permanentAddress || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500"></textarea>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DynamicCompanySelectors 
                companies={companies as any} 
                initialCompanyId={worker.companyId}
                initialDepartmentId={worker.departmentId || ''}
                initialSectionId={worker.sectionId || ''}
                initialSubSectionId={worker.subSectionId || ''}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input type="date" name="joinDate" className="w-full border rounded p-2 outline-none focus:border-blue-500" defaultValue={new Date(worker.joinDate).toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input type="text" name="designation" defaultValue={worker.designation || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select name="grade" defaultValue={worker.grade || ''} className="w-full border rounded p-2 outline-none focus:border-blue-500">
                  <option value="">Select Grade</option>
                  <option value="M">M</option>
                  <option value="S">S</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <SalaryFields 
            initialGross={worker.grossSalary || ''}
            initialBasic={worker.basicSalary || ''}
            initialHouse={worker.houseRent || ''}
            initialConveyance={worker.conveyanceAllowance || ''}
            initialMedical={worker.medicalAllowance || ''}
          />

          <div className="pt-6">
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-full md:w-auto">
              Update Employee Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
