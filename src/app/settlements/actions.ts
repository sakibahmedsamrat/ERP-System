'use server'

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

  revalidatePath('/settlements');
  redirect('/settlements');
}

export async function deleteSettlement(id: string) {
  try {
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
