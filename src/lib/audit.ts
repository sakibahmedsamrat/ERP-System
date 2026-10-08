import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';

const prisma = new PrismaClient();

export async function logAction(module: string, action: string, details: string) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return;
    const payload = await verifyToken(token);
    if (payload && payload.userId && payload.name) {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          userName: payload.name,
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
