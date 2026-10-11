import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const id = searchParams.get('id');

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
    return NextResponse.json({ worker, workers: worker ? [worker] : [] });
  }

  if (!q) {
    return NextResponse.json({ workers: [] });
  }

  const workers = await prisma.worker.findMany({
    where: {
      OR: [
        { workerId: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ]
    },
    include: {
      company: true,
      department: true,
      section: true,
      subSection: true
    },
    take: 10
  });

  return NextResponse.json({ workers });
}

export const dynamic = 'force-dynamic';
