'use server'


import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from '@/lib/audit';
import { parseFlexibleDate, calculateServiceAge, getPayrollCycleDays, numberToWords } from '@/lib/formatDate';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully handle calls outside active Next.js request context (e.g. tests or background jobs)
  }
}

async function syncWorkerStatusForSettlement(
  workerId: string,
  newStatus: string,
  previousStatus: string | null,
  lastWorkingDay?: Date | null,
  settlementId?: string
) {
  const effectiveLwd = (lastWorkingDay && !isNaN(new Date(lastWorkingDay).getTime()))
    ? new Date(lastWorkingDay)
    : new Date();

  if (newStatus === 'PAID') {
    if (previousStatus !== 'PAID') {
      // Transitioned to PAID: auto-exit worker to recycle bin
      await prisma.worker.update({
        where: { id: workerId },
        data: {
          isActive: false,
          isDeleted: true,
          deletedAt: effectiveLwd
        }
      });
      await logAction(
        'WORKERS',
        'AUTO_EXIT',
        `Worker ID ${workerId} automatically exited and moved to recycle bin upon settlement payment.`
      );
    } else {
      // Status was already PAID: only update deletedAt if worker is still in recycle bin
      const currentWorker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: { isDeleted: true }
      });
      if (currentWorker?.isDeleted) {
        await prisma.worker.update({
          where: { id: workerId },
          data: { deletedAt: effectiveLwd }
        });
      }
    }
  } else if (previousStatus === 'PAID' && (newStatus === 'PENDING' || newStatus === 'APPROVED')) {
    // Reverted from PAID: restore worker if no other PAID settlement exists
    const otherPaid = await prisma.settlement.findFirst({
      where: {
        workerId,
        status: 'PAID',
        ...(settlementId ? { NOT: { id: settlementId } } : {})
      }
    });
    if (!otherPaid) {
      await prisma.worker.update({
        where: { id: workerId },
        data: {
          isActive: true,
          isDeleted: false,
          deletedAt: null
        }
      });
      await logAction(
        'WORKERS',
        'RESTORE_ON_STATUS_CHANGE',
        `Worker ID ${workerId} automatically restored to active directory after settlement reverted from PAID to ${newStatus}.`
      );
    }
  }
}

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
    const targetWorker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true, isDeleted: true }
    });
    if (!targetWorker) return { error: 'Worker not found' };
    if (targetWorker.isDeleted) {
      return { error: 'Cannot create settlement for an inactive or deleted employee. Please restore the employee first.' };
    }

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
    const lwd = getDate('lastWorkingDay');

    const createdSettlement = await prisma.settlement.create({
      data: {
        workerId,
        resignApplyDate: getDate('resignApplyDate'),
        lastWorkingDay: lwd,
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
        
        paymentReceiverDate: getDate('paymentReceiverDate') || (statusVal === 'PAID' ? new Date() : null),
        status: statusVal
      }
    });

    if (statusVal === 'PAID') {
      await syncWorkerStatusForSettlement(workerId, statusVal, null, lwd, createdSettlement.id);
    }

    await logAction('SETTLEMENTS', 'CREATE', 'Created settlement for worker: ' + workerId);
    shouldRedirect = true;
  } catch (error: any) {
    console.error("Failed to create settlement:", error);
    return { error: error?.message || 'Failed to create settlement' };
  }

  if (shouldRedirect) {
    safeRevalidatePath('/settlements');
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/payroll');
    redirect('/settlements');
  }
}

export async function deleteSettlement(id: string) {
  try {
    const s = await prisma.settlement.findUnique({
      where: { id },
      include: {
        worker: { select: { id: true, workerId: true, name: true, isDeleted: true } }
      }
    });
    if (!s) return { error: 'Settlement not found' };

    await logAction('SETTLEMENTS', 'DELETE', 'Deleted settlement for worker: ' + s.workerId);
    await prisma.settlement.delete({ where: { id } });

    // If the deleted settlement was PAID and worker was soft-deleted, check if other PAID settlement exists
    if (s.status === 'PAID' && s.worker?.isDeleted) {
      const otherPaid = await prisma.settlement.findFirst({
        where: { workerId: s.workerId, status: 'PAID' }
      });
      if (!otherPaid) {
        await prisma.worker.update({
          where: { id: s.workerId },
          data: {
            isActive: true,
            isDeleted: false,
            deletedAt: null
          }
        }).catch(() => {});
        await logAction(
          'WORKERS',
          'RESTORE_ON_SETTLEMENT_DELETE',
          `Worker ${s.worker.workerId} (${s.worker.name}) reactivated after deleted PAID settlement.`
        );
      }
    }

    safeRevalidatePath('/settlements');
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/payroll');
    safeRevalidatePath('/');
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
    const currentSettlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        worker: { select: { id: true, workerId: true, name: true } }
      }
    });

    const previousStatus = currentSettlement?.status || null;
    const workerId = (formData.get('workerId') as string) || currentSettlement?.workerId;
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

    const status = (formData.get('status') as string) || currentSettlement?.status || 'PENDING';
    const lwd = getDate('lastWorkingDay') || currentSettlement?.lastWorkingDay;
    const paymentReceiverDateInput = getDate('paymentReceiverDate');
    const effectivePaymentReceiverDate = status === 'PAID'
      ? (paymentReceiverDateInput || currentSettlement?.paymentReceiverDate || new Date())
      : null;

    await prisma.settlement.update({
      where: { id },
      data: {
        status,
        resignApplyDate: getDate('resignApplyDate'),
        lastWorkingDay: lwd,
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
        
        paymentReceiverDate: effectivePaymentReceiverDate,
      }
    });

    if (workerId && status) {
      await syncWorkerStatusForSettlement(
        workerId,
        status,
        previousStatus,
        lwd,
        id
      );
    }

    await logAction('SETTLEMENTS', 'UPDATE', 'Updated settlement ID: ' + id);
    shouldRedirect = true;
  } catch (error: any) {
    console.error("Failed to update settlement:", error);
    return { error: error?.message || 'Failed to update settlement' };
  }

  if (shouldRedirect) {
    safeRevalidatePath('/settlements');
    safeRevalidatePath('/settlements/' + id);
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/payroll');
    safeRevalidatePath('/');
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

    safeRevalidatePath('/settlements');
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

    const existingSettlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        worker: {
          select: { id: true, workerId: true, name: true, isDeleted: true, isActive: true }
        }
      }
    });

    if (!existingSettlement) {
      return { success: false, error: 'Settlement not found.' };
    }

    const previousStatus = existingSettlement.status;

    const settlement = await prisma.settlement.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID'
          ? (!existingSettlement.paymentReceiverDate ? { paymentReceiverDate: new Date() } : {})
          : { paymentReceiverDate: null })
      }
    });

    // Handle worker auto-exit or restore
    await syncWorkerStatusForSettlement(
      existingSettlement.workerId,
      status,
      previousStatus,
      existingSettlement.lastWorkingDay,
      id
    );

    await logAction('SETTLEMENTS', 'UPDATE_STATUS', `Updated settlement ${id} status from ${previousStatus} to ${status}`);
    safeRevalidatePath('/settlements');
    safeRevalidatePath(`/settlements/${id}`);
    safeRevalidatePath(`/settlements/${id}/edit`);
    safeRevalidatePath('/workers');
    safeRevalidatePath('/workers/recycle-bin');
    safeRevalidatePath('/payroll');
    safeRevalidatePath('/');
    return { success: true, status: settlement.status };
  } catch (error: any) {
    console.error('Failed to update settlement status:', error);
    return { success: false, error: error?.message || 'Failed to update settlement status.' };
  }
}

