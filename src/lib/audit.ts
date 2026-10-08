import { PrismaClient } from '@prisma/client';
import { getSession } from './auth';

const prisma = new PrismaClient();

export async function logAction(module: string, action: string, details: string) {
  try {
    const session = await getSession();
    if (session && session.user && session.user.userId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.userId,
          userName: session.user.name || 'Unknown',
          module,
          action,
          details
        }
      });
    }
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
