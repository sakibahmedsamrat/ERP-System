import { NextResponse } from 'next/server';

export async function GET() {
  const headers = [
    'Worker ID',
    'Name',
    'Designation',
    'Department',
    'Section',
    'Sub Section',
    'Grade',
    'Join Date (DD/MM/YY)',
    'Gross Salary',
    'Phone',
    'NID',
    'Date of Birth (DD/MM/YY)',
    'Gender',
    'Blood Group',
    'Father Name',
    'Mother Name',
    'Address',
    'Company',
  ];

  // Sample data to guide the user with realistic ERP employee records using DD/MM/YY and DD/MM/YYYY dates
  const sampleData = [
    [
      'EMP-1001',
      'John Doe',
      'Senior Executive',
      'Administration',
      'General Administration',
      'Support Service',
      'M',
      '15/01/24',
      '28500',
      '01711000001',
      '1990123456789',
      '20/05/95',
      'Male',
      'A+',
      'Robert Doe',
      'Mary Doe',
      '123 Industrial Area, Gazipur',
      'MEP Fan Limited.',
    ],
    [
      'EMP-1002',
      'Jane Smith',
      'Software Engineer',
      'Information Technology',
      'Information Technology',
      'ERP Support',
      'M',
      '01/02/2024',
      '35000',
      '01811000002',
      '1992123456789',
      '14/08/1996',
      'Female',
      'B+',
      'David Smith',
      'Sarah Smith',
      '456 Station Road, Dhaka',
      'MEP Fan Limited.',
    ],
    [
      'EMP-1003',
      'Michael Johnson',
      'HR Officer',
      'HR & Admin',
      'HR & Admin',
      'HR & Admin',
      'S',
      '10/03/24',
      '25000',
      '01911000003',
      '1988123456789',
      '25/11/90',
      'Male',
      'O+',
      'James Johnson',
      'Patricia Johnson',
      '789 Mirpur Road, Dhaka',
      'MEP Fan Limited.',
    ],
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

  sampleData.forEach((row) => {
    csvRows.push(row.map(escapeCsv).join(','));
  });

  // Prepend UTF-8 BOM so Microsoft Excel opens cleanly
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="worker_import_template.csv"',
    },
  });
}

export const dynamic = 'force-dynamic';
