import prisma from '@/lib/prisma';
import TrainingClient from './TrainingClient';

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const [trainingsRaw, totalWorkers, skillsRaw, complianceCertsRaw, workersRaw] = await Promise.all([
    prisma.training.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { workers: true }
        }
      }
    }),
    prisma.worker.count({ where: { isDeleted: false, isActive: true } }),
    prisma.workerSkill.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        worker: {
          select: {
            id: true,
            workerId: true,
            name: true,
            department: { select: { name: true } },
            company: { select: { name: true } }
          }
        }
      }
    }),
    prisma.complianceCertification.findMany({
      orderBy: { expiryDate: 'asc' },
      include: {
        worker: {
          select: {
            id: true,
            workerId: true,
            name: true,
            department: { select: { name: true } }
          }
        }
      }
    }),
    prisma.worker.findMany({
      where: { isDeleted: false, isActive: true },
      select: {
        id: true,
        workerId: true,
        name: true,
        department: { select: { name: true } },
        company: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  const trainings = trainingsRaw.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    date: t.date.toISOString(),
    location: t.location,
    status: t.status,
    _count: t._count
  }));

  const skills = skillsRaw.map(s => ({
    id: s.id,
    skillCategory: s.skillCategory,
    skillName: s.skillName,
    proficiency: s.proficiency,
    certifiedDate: s.certifiedDate ? s.certifiedDate.toISOString() : null,
    expiryDate: s.expiryDate ? s.expiryDate.toISOString() : null,
    certifyingBody: s.certifyingBody,
    status: s.status,
    worker: s.worker
  }));

  const complianceCerts = complianceCertsRaw.map(c => ({
    id: c.id,
    type: c.type,
    issueDate: c.issueDate.toISOString(),
    expiryDate: c.expiryDate.toISOString(),
    certificateNumber: c.certificateNumber,
    issuingAuthority: c.issuingAuthority,
    status: c.status,
    worker: c.worker
  }));

  return (
    <TrainingClient
      trainings={trainings}
      totalWorkers={totalWorkers}
      skills={skills}
      complianceCerts={complianceCerts}
      workers={workersRaw}
    />
  );
}
