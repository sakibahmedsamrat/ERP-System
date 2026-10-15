'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';
import { parseFlexibleDate, calculateServiceAge, getPayrollCycleDays, numberToWords } from '@/lib/formatDate';


export async function createSettlement(formData: FormData): Promise<{ error?: string } | void> {
  const workerId = formData.get('workerId') as string;
  if (!workerId) return { error: 'Worker is required' };

  const getFloat = (name: string) => {
    const val = formData.get(name) as string;
    return val ? parseFloat(val) : 0;
  };

  const getDate = (name: string) => {
    const val = formData.get(name) as string;
    return val ? parseFlexibleDate(val) : null;
  };

  let shouldRedirect = false;
  try {
    const joinDateVal = formData.get('joinDate') as string;
    if (joinDateVal && workerId) {
      const parsedJoin = parseFlexibleDate(joinDateVal);
      if (parsedJoin && !isNaN(parsedJoin.getTime())) {
        await prisma.worker.update({
          where: { id: workerId },
          data: { joinDate: parsedJoin }
        }).catch(() => {});
      }
    }

    let serviceAge = (formData.get('serviceAge') as string) || '';
    if (serviceAge === 'Invalid Date') serviceAge = '';

    const statusVal = (formData.get('status') as string) || 'PENDING';

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
        status: statusVal
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
    return val ? parseFlexibleDate(val) : null;
  };

  let shouldRedirect = false;
  try {
    const workerId = formData.get('workerId') as string;
    const joinDateVal = formData.get('joinDate') as string;
    if (joinDateVal && workerId) {
      const parsedJoin = parseFlexibleDate(joinDateVal);
      if (parsedJoin && !isNaN(parsedJoin.getTime())) {
        await prisma.worker.update({
          where: { id: workerId },
          data: { joinDate: parsedJoin }
        }).catch(() => {});
      }
    }

    let serviceAge = (formData.get('serviceAge') as string) || '';
    if (serviceAge === 'Invalid Date') serviceAge = '';

    const status = formData.get('status') as string;

    await prisma.settlement.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
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

export async function recordEmployeeResignation(data: {
  workerId: string;
  resignApplyDate: string;
  lastWorkingDay: string;
  remarks?: string;
}): Promise<{ success: boolean; settlementId?: string; settlement?: any; error?: string }> {
  try {
    const { workerId, resignApplyDate, lastWorkingDay } = data;
    if (!workerId) return { success: false, error: 'Employee is required.' };
    if (!resignApplyDate) return { success: false, error: 'Resign Apply Date is required.' };
    if (!lastWorkingDay) return { success: false, error: 'Last Working Day is required.' };

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        company: true,
        department: true,
        section: true,
        subSection: true
      }
    });

    if (!worker || worker.isDeleted) return { success: false, error: 'Employee not found.' };

    const resignDate = parseFlexibleDate(resignApplyDate);
    const lwdDate = parseFlexibleDate(lastWorkingDay);

    if (!resignDate || !lwdDate) {
      return { success: false, error: 'Invalid dates provided.' };
    }

    // 1. Calculate service age
    let serviceAgeText = '';
    let serviceAgeYears = 0;
    let serviceAgeMonths = 0;
    let serviceAgeDays = 0;
    let isDateInverted = false;

    if (worker.joinDate && lwdDate) {
      const calc = calculateServiceAge(worker.joinDate, lwdDate);
      if (calc.isValid) {
        serviceAgeText = calc.text;
        serviceAgeYears = calc.years;
        serviceAgeMonths = calc.months;
        serviceAgeDays = calc.days;
        isDateInverted = calc.isInverted;
      }
    }

    const basicSalary = worker.basicSalary || 0;
    const grossSalary = worker.grossSalary || 0;
    const houseRent = worker.houseRent || 0;
    const conveyanceAllowance = worker.conveyanceAllowance || 0;
    const medicalAllowance = worker.medicalAllowance || 0;

    // 2. Service Benefit calculation (Labour Act)
    let serviceBenefitAmount = 0;
    if (basicSalary > 0 && !isDateInverted) {
      const perDayBasic = basicSalary / 30;
      const isOver10 = serviceAgeYears > 10 || (serviceAgeYears === 10 && (serviceAgeMonths > 0 || serviceAgeDays > 0));
      const isOver3 = serviceAgeYears > 3 || (serviceAgeYears === 3 && (serviceAgeMonths > 0 || serviceAgeDays > 0));

      if (isOver10) {
        serviceBenefitAmount = Math.round(perDayBasic * (30 * serviceAgeYears));
      } else if (isOver3) {
        serviceBenefitAmount = Math.round(perDayBasic * (15 * serviceAgeYears));
      } else if (serviceAgeYears === 3) {
        serviceBenefitAmount = Math.round(perDayBasic * (7 * serviceAgeYears));
      }
    }

    // 3. Deduct Money (Act of 2006) - shortfall from 60 days notice
    let deductMoneyAct2006 = 0;
    if (basicSalary > 0 && resignDate && lwdDate) {
      const diffTime = lwdDate.getTime() - resignDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const shortfall = Math.min(60, Math.max(0, 60 - diffDays));
      if (shortfall > 0) {
        deductMoneyAct2006 = Math.round(shortfall * (basicSalary / 30));
      }
    }

    // 4. Check if a PENDING settlement already exists for this worker
    const existingPending = await prisma.settlement.findFirst({
      where: {
        workerId: worker.id,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });

    const cycleInfo = getPayrollCycleDays(lwdDate);
    const daysInMonth = cycleInfo.daysInCycle || 30;

    const currentMonthWorkingDays = existingPending?.currentMonthWorkingDays || 0;
    const absentDays = existingPending?.absentDays || 0;
    const totalEarnLeaveDays = existingPending?.totalEarnLeaveDays || 0;
    const totalLateEarlyMinutes = existingPending?.totalLateEarlyMinutes || 0;
    const extraDutyOTPay = existingPending?.extraDutyOTPay || 0;

    const currentMonthWorkDayPay = (grossSalary > 0 && currentMonthWorkingDays > 0)
      ? Math.round((grossSalary / daysInMonth) * currentMonthWorkingDays)
      : (existingPending?.currentMonthWorkDayPay || 0);

    const earnLeavePay = (grossSalary > 0 && totalEarnLeaveDays > 0)
      ? Math.round((grossSalary / 30) * totalEarnLeaveDays)
      : (existingPending?.earnLeavePay || 0);

    const absentDeduction = (grossSalary > 0 && absentDays > 0)
      ? Math.round((grossSalary / daysInMonth) * absentDays)
      : (existingPending?.absentDeduction || 0);

    const lateEarlyDeduction = (grossSalary > 0 && totalLateEarlyMinutes > 0)
      ? Math.round((grossSalary / daysInMonth / 8 / 60) * totalLateEarlyMinutes)
      : (existingPending?.lateEarlyDeduction || 0);

    const payableSubTotal = serviceBenefitAmount + currentMonthWorkDayPay + extraDutyOTPay + earnLeavePay;
    const deductionSubTotal = deductMoneyAct2006 + absentDeduction + lateEarlyDeduction;
    const totalPayAmount = payableSubTotal - deductionSubTotal;

    let amountInWords = '';
    if (totalPayAmount > 0) {
      amountInWords = `${numberToWords(Math.round(totalPayAmount))} Taka Only.`;
    } else if (totalPayAmount < 0) {
      amountInWords = `Minus ${numberToWords(Math.abs(Math.round(totalPayAmount)))} Taka Only.`;
    } else {
      amountInWords = 'Zero Taka Only.';
    }

    let settlement;
    if (existingPending) {
      settlement = await prisma.settlement.update({
        where: { id: existingPending.id },
        data: {
          resignApplyDate: resignDate,
          lastWorkingDay: lwdDate,
          serviceAge: serviceAgeText,
          grossSalary,
          basicSalary,
          houseRent,
          conveyanceAllowance,
          medicalAllowance,
          serviceBenefitAmount,
          currentMonthWorkDayPay,
          earnLeavePay,
          extraDutyOTPay,
          deductMoneyAct2006,
          absentDeduction,
          lateEarlyDeduction,
          payableSubTotal,
          deductionSubTotal,
          totalPayAmount,
          amountInWords,
          status: 'PENDING'
        }
      });
      const logMsg = `Updated resignation details for worker: ${worker.workerId} (${worker.name})${data.remarks ? ` [Remarks: ${data.remarks}]` : ''}`;
      await logAction('SETTLEMENTS', 'UPDATE', logMsg);
    } else {
      settlement = await prisma.settlement.create({
        data: {
          workerId: worker.id,
          resignApplyDate: resignDate,
          lastWorkingDay: lwdDate,
          serviceAge: serviceAgeText,
          grossSalary,
          basicSalary,
          houseRent,
          conveyanceAllowance,
          medicalAllowance,
          serviceBenefitAmount,
          currentMonthWorkDayPay: 0,
          earnLeavePay: 0,
          extraDutyOTPay: 0,
          deductMoneyAct2006,
          absentDeduction: 0,
          lateEarlyDeduction: 0,
          payableSubTotal,
          deductionSubTotal,
          totalPayAmount,
          amountInWords,
          status: 'PENDING'
        }
      });
      const logMsg = `Recorded resignation and created pending settlement for worker: ${worker.workerId} (${worker.name})${data.remarks ? ` [Remarks: ${data.remarks}]` : ''}`;
      await logAction('SETTLEMENTS', 'CREATE', logMsg);
    }

    const fullSettlement = await prisma.settlement.findUnique({
      where: { id: settlement.id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            workerId: true,
            designation: true,
            department: { select: { name: true } },
            company: { select: { name: true } },
          }
        }
      }
    });

    revalidatePath('/settlements');
    return { success: true, settlementId: settlement.id, settlement: fullSettlement };
  } catch (error: any) {
    console.error('Failed to record resignation:', error);
    return { success: false, error: error?.message || 'Failed to record resignation.' };
  }
}

export async function updateSettlementStatus(
  id: string,
  status: 'PENDING' | 'APPROVED' | 'PAID'
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const validStatuses = ['PENDING', 'APPROVED', 'PAID'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid status provided.' };
    }

    const settlement = await prisma.settlement.update({
      where: { id },
      data: { status }
    });

    await logAction('SETTLEMENTS', 'UPDATE_STATUS', `Updated settlement ${id} status to ${status}`);
    revalidatePath('/settlements');
    revalidatePath(`/settlements/${id}`);
    revalidatePath(`/settlements/${id}/edit`);
    return { success: true, status: settlement.status };
  } catch (error: any) {
    console.error('Failed to update settlement status:', error);
    return { success: false, error: error?.message || 'Failed to update settlement status.' };
  }
}

