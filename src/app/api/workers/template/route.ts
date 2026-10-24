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
    'Join Date',
    'Gross Salary',
    'Phone',
    'NID',
    'Date of Birth',
    'Gender',
    'Blood Group',
    'Father Name',
    'Mother Name',
    'Address',
    'Company',
  ];

  // Sample data to guide the user with realistic ERP employee records
  const sampleData = [
    [
      'EMP-1001',
      'John Doe',
      'Senior Operator',
      'Production',
      'Sewing',
      'Line-01',
      'Grade-4',
      '2024-01-15',
      '18500',
      '01711000001',
      '1990123456789',
      '1995-05-20',
      'Male',
      'A+',
      'Robert Doe',
      'Mary Doe',
      '123 Industrial Area, Gazipur',
      'Main Company',
    ],
    [
      'EMP-1002',
      'Jane Smith',
      'Quality Inspector',
      'Quality Assurance',
      'Finishing',
      'Inspection-A',
      'Grade-3',
      '2024-02-01',
      '22000',
      '01811000002',
      '1992123456789',
      '1996-08-14',
      'Female',
      'B+',
      'David Smith',
      'Sarah Smith',
      '456 Station Road, Dhaka',
      'Main Company',
    ],
    [
      'EMP-1003',
      'Michael Johnson',
      'Technician',
      'Maintenance',
      'Electrical',
      'Power-1',
      'Grade-2',
      '2024-03-10',
      '25000',
      '01911000003',
      '1988123456789',
      '1990-11-25',
      'Male',
      'O+',
      'James Johnson',
      'Patricia Johnson',
      '789 Mirpur Road, Dhaka',
      'Main Company',
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
