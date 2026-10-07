import { NextResponse } from 'next/server';

export async function GET() {
  const headers = ['Company', 'Department', 'Section', 'Sub Section'];
  
  // Sample data to guide the user
  const sampleData = [
    ['MEP', 'Production', 'Accessories-FG', 'Main Switch-1'],
    ['MEP', 'Production', 'Accessories-FG', 'Main Switch-2'],
    ['MEP', 'Supply Chain Management', 'Distribution and Logistic', 'Central Distribution'],
    ['FAN', 'Production', 'Auto Powder Coating', 'Auto Powder Coating']
  ];

  const csvRows = [];
  csvRows.push(headers.join(','));
  
  sampleData.forEach(row => {
    const escapedRow = row.map(field => `"${field.replace(/"/g, '""')}"`);
    csvRows.push(escapedRow.join(','));
  });

  const csvContent = "\uFEFF" + csvRows.join('\n'); // UTF-8 BOM

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="company_structure_template.csv"'
    }
  });
}
