import { PrismaClient } from '@prisma/client';
import { formatDate } from '@/lib/formatDate';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  const workers = await prisma.worker.findMany({
    include: { 
      company: true,
      department: true,
      section: true,
      subSection: true
    }
  });

  const headers = [
    'workerId', 'name', 'designation', 'gender', 'bloodGroup', 
    'religion', 'nationalId', 'phone', 'address', 'permanentAddress', 
    'joinDate', 'department', 'section', 'subSection', 'grade', 'company', 'Gross Salary', 'Basic Salary', 'House Rent', 'Conveyance Allowance', 'Medical Allowance'
  ];

  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const w of workers) {
    const row = [
      w.workerId, w.name, w.designation || '', w.gender || '', w.bloodGroup || '',
      w.religion || '', w.nationalId || '', w.phone || '', w.address || '', w.permanentAddress || '',
      formatDate(w.joinDate), w.department?.name || '', w.section?.name || '', w.subSection?.name || '', 
      w.grade || '', w.company?.name || '', w.grossSalary || 0, w.basicSalary || 0, w.houseRent || 0, w.conveyanceAllowance || 0, w.medicalAllowance || 0
    ];
    // escape commas
    const escapedRow = row.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v);
    csvRows.push(escapedRow.join(','));
  }

  return new NextResponse(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="workers_export.csv"',
    },
  });
}

export const dynamic = 'force-dynamic';


