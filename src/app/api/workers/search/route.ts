import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ workers: [] });
  }

  const workers = await prisma.worker.findMany({
    where: {
      OR: [
        { workerId: { contains: q } },
        { name: { contains: q } },
        { phone: { contains: q } }
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
