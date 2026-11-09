import prisma, { withDbTimeout } from '@/lib/prisma';
import { getSession } from './auth';

export async function logAction(module: string, action: string, details: string) {
  try {
    const session = await getSession();
    if (session && session.user && session.user.userId) {
      await withDbTimeout(
        prisma.auditLog.create({
          data: {
            userId: session.user.userId,
            userName: session.user.name || 'Unknown',
            module,
            action,
            details,
          },
        }),
        3000,
        null
      );
    }
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
