import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const id = searchParams.get('id');
  const withPhoto = searchParams.get('withPhoto') === 'true';

  if (id) {
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        company: true,
        department: true,
        section: true,
        subSection: true
      }
    });
    const res = NextResponse.json({ worker, workers: worker ? [worker] : [] });
    res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    return res;
  }

  if (!q) {
    return NextResponse.json({ workers: [] });
  }

  const selectFields: any = {
    id: true,
    workerId: true,
    name: true,
    designation: true,
    phone: true,
    gender: true,
    bloodGroup: true,
    religion: true,
    nationalId: true,
    grade: true,
    grossSalary: true,
    basicSalary: true,
    houseRent: true,
    conveyanceAllowance: true,
    medicalAllowance: true,
    joinDate: true,
    companyId: true,
    company: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    section: { select: { id: true, name: true } },
    subSection: { select: { id: true, name: true } }
  };

  if (withPhoto) {
    selectFields.photoUrl = true;
    selectFields.signatureUrl = true;
  }

  const workers = await prisma.worker.findMany({
    where: {
      OR: [
        { workerId: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ]
    },
    select: selectFields,
    take: 10
  });

  const res = NextResponse.json({ workers });
  res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
  return res;
}

export const dynamic = 'force-dynamic';
