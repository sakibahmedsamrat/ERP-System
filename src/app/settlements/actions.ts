'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';


export async function createSettlement(formData: FormData): Promise<{ error?: string } | void> {
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

  let shouldRedirect = false;
  try {
    const joinDateVal = formData.get('joinDate') as string;
    if (joinDateVal && workerId) {
      const parsedJoin = new Date(joinDateVal);
      if (!isNaN(parsedJoin.getTime())) {
        await prisma.worker.update({
          where: { id: workerId },
          data: { joinDate: parsedJoin }
        }).catch(() => {});
      }
    }

    let serviceAge = (formData.get('serviceAge') as string) || '';
    if (serviceAge === 'Invalid Date') serviceAge = '';

    await prisma.settlement.create({
      data: {
        workerId,
        resignApplyDate: getDate('resignApplyDate'),
        lastWorkingDay: getDate('lastWorkingDay'),
        serviceAge,
      
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
        bankAccNo: (formData.get('bankAccNo') as string) || null,
        
        paymentReceiverDate: getDate('paymentReceiverDate'),
        status: 'PENDING'
      }
    });

    await logAction('SETTLEMENTS', 'CREATE', 'Created settlement for worker: ' + workerId);
    shouldRedirect = true;
  } catch (error: any) {
    console.error("Failed to create settlement:", error);
    return { error: error?.message || 'Failed to create settlement' };
  }

  if (shouldRedirect) {
    revalidatePath('/settlements');
    redirect('/settlements');
  }
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

export async function updateSettlement(id: string, formData: FormData): Promise<{ error?: string } | void> {
  const getFloat = (name: string) => {
    const val = formData.get(name) as string;
    return val ? parseFloat(val) : 0;
  };

  const getDate = (name: string) => {
    const val = formData.get(name) as string;
    return val ? new Date(val) : null;
  };

  let shouldRedirect = false;
  try {
    const workerId = formData.get('workerId') as string;
    const joinDateVal = formData.get('joinDate') as string;
    if (joinDateVal && workerId) {
      const parsedJoin = new Date(joinDateVal);
      if (!isNaN(parsedJoin.getTime())) {
        await prisma.worker.update({
          where: { id: workerId },
          data: { joinDate: parsedJoin }
        }).catch(() => {});
      }
    }

    let serviceAge = (formData.get('serviceAge') as string) || '';
    if (serviceAge === 'Invalid Date') serviceAge = '';

    await prisma.settlement.update({
      where: { id },
      data: {
        resignApplyDate: getDate('resignApplyDate'),
        lastWorkingDay: getDate('lastWorkingDay'),
        serviceAge,
      
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
        bankAccNo: (formData.get('bankAccNo') as string) || null,
        
        paymentReceiverDate: getDate('paymentReceiverDate'),
      }
    });

    await logAction('SETTLEMENTS', 'UPDATE', 'Updated settlement ID: ' + id);
    shouldRedirect = true;
  } catch (error: any) {
    console.error("Failed to update settlement:", error);
    return { error: error?.message || 'Failed to update settlement' };
  }

  if (shouldRedirect) {
    revalidatePath('/settlements');
    revalidatePath('/settlements/' + id);
    redirect('/settlements');
  }
}
export async function getSettlement(id: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      worker: {
        select: {
          id: true,
          workerId: true,
          name: true,
          designation: true,
          grade: true,
          grossSalary: true,
          basicSalary: true,
          joinDate: true,
          company: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          subSection: { select: { id: true, name: true } }
        }
      }
    }
  });
  return settlement;
}

