import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/formatDate';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const role = session.user.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const workers = await prisma.worker.findMany({
    where: { isDeleted: false },
    select: { 
      workerId: true,
      name: true,
      designation: true,
      gender: true,
      bloodGroup: true,
      religion: true,
      nationalId: true,
      phone: true,
      address: true,
      permanentAddress: true,
      joinDate: true,
      grade: true,
      grossSalary: true,
      basicSalary: true,
      houseRent: true,
      conveyanceAllowance: true,
      medicalAllowance: true,
      company: { select: { name: true } },
      department: { select: { name: true } },
      section: { select: { name: true } },
      subSection: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const headers = [
    'workerId', 'name', 'designation', 'gender', 'bloodGroup', 
    'religion', 'nationalId', 'phone', 'address', 'permanentAddress', 
    'joinDate', 'department', 'section', 'subSection', 'grade', 'company', 
    'Gross Salary', 'Basic Salary', 'House Rent', 'Conveyance Allowance', 'Medical Allowance'
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.map(escapeCsv).join(',')];

  for (const w of workers) {
    const row = [
      w.workerId, 
      w.name, 
      w.designation || '', 
      w.gender || '', 
      w.bloodGroup || '',
      w.religion || '', 
      w.nationalId || '', 
      w.phone || '', 
      w.address || '', 
      w.permanentAddress || '',
      formatDate(w.joinDate), 
      w.department?.name || '', 
      w.section?.name || '', 
      w.subSection?.name || '', 
      w.grade || '', 
      w.company?.name || '', 
      w.grossSalary || 0, 
      w.basicSalary || 0, 
      w.houseRent || 0, 
      w.conveyanceAllowance || 0, 
      w.medicalAllowance || 0
    ];
    csvRows.push(row.map(escapeCsv).join(','));
  }

  // Prepend UTF-8 BOM so Excel opens UTF-8 encoded text correctly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="workers_export.csv"',
    },
  });
}

export const dynamic = 'force-dynamic';
