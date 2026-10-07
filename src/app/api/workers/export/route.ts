import { PrismaClient } from '@prisma/client';
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
    'joinDate', 'department', 'section', 'subSection', 'grade', 'company'
  ];

  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const w of workers) {
    const row = [
      w.workerId, w.name, w.designation || '', w.gender || '', w.bloodGroup || '',
      w.religion || '', w.nationalId || '', w.phone || '', w.address || '', w.permanentAddress || '',
      w.joinDate.toISOString().split('T')[0], w.department?.name || '', w.section?.name || '', w.subSection?.name || '', 
      w.grade || '', w.company.name
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
