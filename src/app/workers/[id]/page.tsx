import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Worker360Client from './Worker360Client';

export const dynamic = 'force-dynamic';

export default async function WorkerDossierPage({ params }: { params: { id: string } }) {
  const worker = await prisma.worker.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subSection: { select: { id: true, name: true } },
      documents: {
        orderBy: { uploadedAt: 'desc' }
      },
      careerHistory: {
        orderBy: { effectiveDate: 'desc' }
      },
      disciplinaryRecords: {
        orderBy: { incidentDate: 'desc' }
      }
    }
  });

  if (!worker || worker.isDeleted) {
    return notFound();
  }

  // Convert Dates to ISO strings for client component serialization
  const serializedWorker = {
    ...worker,
    joinDate: worker.joinDate.toISOString(),
    createdAt: worker.createdAt.toISOString(),
    updatedAt: worker.updatedAt.toISOString(),
    confirmed6mAt: worker.confirmed6mAt ? worker.confirmed6mAt.toISOString() : null,
    confirmed3yAt: worker.confirmed3yAt ? worker.confirmed3yAt.toISOString() : null,
    documents: worker.documents.map((d) => ({
      ...d,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    careerHistory: worker.careerHistory.map((c) => ({
      ...c,
      effectiveDate: c.effectiveDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
    disciplinaryRecords: worker.disciplinaryRecords.map((dr) => ({
      ...dr,
      incidentDate: dr.incidentDate.toISOString(),
      createdAt: dr.createdAt.toISOString(),
    }))
  };

  return <Worker360Client worker={serializedWorker} />;
}
