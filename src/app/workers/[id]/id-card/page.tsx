import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function IDCardPage({ params }: { params: { id: string } }) {
  const worker = await prisma.worker.findUnique({
    where: { id: params.id },
    include: { department: true, section: true }
  });

  if (!worker) {
    notFound();
  }

  const queryParams = new URLSearchParams({
    name: worker.name || '',
    designation: worker.designation || '',
    section: worker.section?.name || worker.department?.name || '',
    id: worker.workerId || '',
    joinDate: worker.joinDate ? new Date(worker.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    blood: worker.bloodGroup || '',
    phone: worker.phone || '',
    nid: worker.nationalId || ''
  });

  redirect(`/id-card/index.html?${queryParams.toString()}`);
}
