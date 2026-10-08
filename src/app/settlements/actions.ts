'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';

const prisma = new PrismaClient();

export async function createSettlement(formData: FormData) {
  const workerId = formData.get('workerId') as string;
  if (!workerId) return { error: 'Worker is required' };

  const getFloat = (name: string) => {
    const val = formData.get(name) as string;
    return val ? parseFloat(val) : 0;
  };

  const getDate = (name: string) => {
    const val = formData.get(name) as string;
    return val ? new Date(val) : null;
  };

  await prisma.settlement.create({
    data: {
      workerId,
      resignApplyDate: getDate('resignApplyDate'),
      lastWorkingDay: getDate('lastWorkingDay'),
      serviceAge: formData.get('serviceAge') as string,
      
      grossSalary: getFloat('grossSalary'),
      basicSalary: getFloat('basicSalary'),
      houseRent: getFloat('houseRent'),
      conveyanceAllowance: getFloat('conveyanceAllowance'),
      medicalAllowance: getFloat('medicalAllowance'),
      
      totalEarnLeaveDays: getFloat('totalEarnLeaveDays'),
      totalLateEarlyMinutes: getFloat('totalLateEarlyMinutes'),
      currentMonthWorkingDays: getFloat('currentMonthWorkingDays'),
      absentDays: getFloat('absentDays'),
      
      serviceBenefitAmount: getFloat('serviceBenefitAmount'),
      currentMonthWorkDayPay: getFloat('currentMonthWorkDayPay'),
      extraDutyOTPay: getFloat('extraDutyOTPay'),
      earnLeavePay: getFloat('earnLeavePay'),
      
      deductMoneyAct2006: getFloat('deductMoneyAct2006'),
      absentDeduction: getFloat('absentDeduction'),
      lateEarlyDeduction: getFloat('lateEarlyDeduction'),
      
      payableSubTotal: getFloat('payableSubTotal'),
      deductionSubTotal: getFloat('deductionSubTotal'),
      totalPayAmount: getFloat('totalPayAmount'),
      amountInWords: formData.get('amountInWords') as string,
      
      paymentReceiverDate: getDate('paymentReceiverDate'),
      status: 'PENDING'
    }
  });

  await logAction('SETTLEMENTS', 'CREATE', 'Created settlement for worker: ' + workerId);
  revalidatePath('/settlements');
  redirect('/settlements');
}

export async function deleteSettlement(id: string) {
  try {
    const s = await prisma.settlement.findUnique({where: {id}});
    if(s) await logAction('SETTLEMENTS', 'DELETE', 'Deleted settlement for worker: ' + s.workerId);
    await prisma.settlement.delete({ where: { id } });
    revalidatePath('/settlements');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete settlement:", error);
    return { error: 'Failed to delete settlement' };
  }
}
export async function updateSettlement(id: string, formData: FormData) {
  const getFloat = (name: string) => {
    const val = formData.get(name) as string;
    return val ? parseFloat(val) : 0;
  };

  const getDate = (name: string) => {
    const val = formData.get(name) as string;
    return val ? new Date(val) : null;
  };

  await prisma.settlement.update({
    where: { id },
    data: {
      resignApplyDate: getDate('resignApplyDate'),
      lastWorkingDay: getDate('lastWorkingDay'),
      serviceAge: formData.get('serviceAge') as string,
      
      grossSalary: getFloat('grossSalary'),
      basicSalary: getFloat('basicSalary'),
      houseRent: getFloat('houseRent'),
      conveyanceAllowance: getFloat('conveyanceAllowance'),
      medicalAllowance: getFloat('medicalAllowance'),
      
      totalEarnLeaveDays: getFloat('totalEarnLeaveDays'),
      totalLateEarlyMinutes: getFloat('totalLateEarlyMinutes'),
      currentMonthWorkingDays: getFloat('currentMonthWorkingDays'),
      absentDays: getFloat('absentDays'),
      
      serviceBenefitAmount: getFloat('serviceBenefitAmount'),
      currentMonthWorkDayPay: getFloat('currentMonthWorkDayPay'),
      extraDutyOTPay: getFloat('extraDutyOTPay'),
      earnLeavePay: getFloat('earnLeavePay'),
      
      deductMoneyAct2006: getFloat('deductMoneyAct2006'),
      absentDeduction: getFloat('absentDeduction'),
      lateEarlyDeduction: getFloat('lateEarlyDeduction'),
      
      payableSubTotal: getFloat('payableSubTotal'),
      deductionSubTotal: getFloat('deductionSubTotal'),
      totalPayAmount: getFloat('totalPayAmount'),
      amountInWords: formData.get('amountInWords') as string,
      
      paymentReceiverDate: getDate('paymentReceiverDate'),
    }
  });

  await logAction('SETTLEMENTS', 'UPDATE', 'Updated settlement ID: ' + id);
  revalidatePath('/settlements');
  revalidatePath('/settlements/' + id);
  redirect('/settlements');
}
export async function getSettlement(id: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: { worker: { include: { company: true, department: true, section: true, subSection: true } } }
  });
  return settlement;
}

