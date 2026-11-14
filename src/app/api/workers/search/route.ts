import prisma, { withDbTimeout } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const id = searchParams.get('id');
    const withPhoto = searchParams.get('withPhoto') === 'true';

    if (id) {
      const worker = await withDbTimeout(
        prisma.worker.findUnique({
          where: { id },
          include: {
            company: true,
            department: true,
            section: true,
            subSection: true,
          },
        }),
        5000,
        null
      );
      const validWorker = worker && !worker.isDeleted ? worker : null;
      const res = NextResponse.json({ worker: validWorker, workers: validWorker ? [validWorker] : [] });
      res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
      return res;
    }

    const qTrimmed = q?.trim() || '';
    if (!qTrimmed) {
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
      subSection: { select: { id: true, name: true } },
    };

    if (withPhoto) {
      selectFields.photoUrl = true;
      selectFields.signatureUrl = true;
    }

    const qLower = qTrimmed.toLowerCase();
    const qWithoutLeadingZeros = qTrimmed.replace(/^0+/, '');

    // Search workerId, name, and phone in parallel.
    // Querying workerId separately guarantees that employees whose workerId matches
    // (exact, prefix, or contains) are NEVER crowded out by high volume of phone/name matches.
    const [idWorkers, nameWorkers, phoneWorkers] = await Promise.all([
      withDbTimeout(
        prisma.worker.findMany({
          where: {
            isDeleted: false,
            OR: [
              { workerId: { contains: qTrimmed, mode: 'insensitive' } },
              ...(qWithoutLeadingZeros && qWithoutLeadingZeros !== qTrimmed
                ? [{ workerId: { contains: qWithoutLeadingZeros, mode: 'insensitive' as const } }]
                : []),
            ],
          },
          select: selectFields,
          take: 30,
        }),
        5000,
        []
      ),
      withDbTimeout(
        prisma.worker.findMany({
          where: {
            isDeleted: false,
            name: { contains: qTrimmed, mode: 'insensitive' },
          },
          select: selectFields,
          take: 20,
        }),
        5000,
        []
      ),
      withDbTimeout(
        prisma.worker.findMany({
          where: {
            isDeleted: false,
            phone: { contains: qTrimmed, mode: 'insensitive' },
          },
          select: selectFields,
          take: 15,
        }),
        5000,
        []
      ),
    ]);

    const workerMap = new Map<string, any>();
    for (const w of (idWorkers as any[]) || []) workerMap.set(w.id, w);
    for (const w of (nameWorkers as any[]) || []) if (!workerMap.has(w.id)) workerMap.set(w.id, w);
    for (const w of (phoneWorkers as any[]) || []) if (!workerMap.has(w.id)) workerMap.set(w.id, w);

    const rawWorkers = Array.from(workerMap.values());

    const workers = rawWorkers
      .sort((a: any, b: any) => {
        const aId = String(a.workerId || '').toLowerCase();
        const bId = String(b.workerId || '').toLowerCase();
        const aName = String(a.name || '').toLowerCase();
        const bName = String(b.name || '').toLowerCase();

        // 1. Exact workerId match first
        const aIdExact = aId === qLower || (qWithoutLeadingZeros && aId === qWithoutLeadingZeros);
        const bIdExact = bId === qLower || (qWithoutLeadingZeros && bId === qWithoutLeadingZeros);
        if (aIdExact && !bIdExact) return -1;
        if (!aIdExact && bIdExact) return 1;

        // 2. workerId starts with query
        const aIdStarts = aId.startsWith(qLower) || (qWithoutLeadingZeros && aId.startsWith(qWithoutLeadingZeros));
        const bIdStarts = bId.startsWith(qLower) || (qWithoutLeadingZeros && bId.startsWith(qWithoutLeadingZeros));
        if (aIdStarts && !bIdStarts) return -1;
        if (!aIdStarts && bIdStarts) return 1;

        // 3. If both start with query, shorter length workerId comes first (e.g. 49 before 491 before 4917)
        if (aIdStarts && bIdStarts && aId.length !== bId.length) {
          return aId.length - bId.length;
        }

        // 4. workerId contains query
        const aIdContains = aId.includes(qLower);
        const bIdContains = bId.includes(qLower);
        if (aIdContains && !bIdContains) return -1;
        if (!aIdContains && bIdContains) return 1;

        // 5. exact name match
        const aNameExact = aName === qLower;
        const bNameExact = bName === qLower;
        if (aNameExact && !bNameExact) return -1;
        if (!aNameExact && bNameExact) return 1;

        // 6. name starts with query
        const aNameStarts = aName.startsWith(qLower);
        const bNameStarts = bName.startsWith(qLower);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;

        // 7. any word in name starts with query
        const aWordStarts = aName.split(/\s+/).some((w: string) => w.startsWith(qLower));
        const bWordStarts = bName.split(/\s+/).some((w: string) => w.startsWith(qLower));
        if (aWordStarts && !bWordStarts) return -1;
        if (!aWordStarts && bWordStarts) return 1;

        return 0;
      })
      .slice(0, 15);

    const res = NextResponse.json({ workers });
    res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    return res;
  } catch (err: any) {
    console.error('Failed to search workers in API route:', err);
    return NextResponse.json({ workers: [], error: 'Failed to search employees' }, { status: 200 });
  }
}

export const dynamic = 'force-dynamic';
