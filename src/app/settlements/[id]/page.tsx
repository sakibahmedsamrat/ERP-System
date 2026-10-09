import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { formatDate } from '@/lib/formatDate';
import PrintButton from './PrintButton';

const prisma = new PrismaClient();

export default async function SettlementPrintPage({ params }: { params: { id: string } }) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: params.id },
    include: { 
      worker: {
        include: {
          company: true,
          department: true,
          section: true,
          subSection: true
        }
      } 
    }
  });

  if (!settlement) return <div>Settlement not found</div>;
  const w = settlement.worker;

  return (
    <div className="p-8 max-w-5xl mx-auto print:p-0 print:max-w-full">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}} />
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link href="/settlements" className="text-blue-600 hover:underline">
          &larr; Back to Settlements
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-10 border border-gray-200 print:shadow-none print:border-none print:p-0 print:text-[14px]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div className="w-1/4">
            <img src="/logo.png" alt="MEP Logo" className="h-16 print:h-12 object-contain" />
          </div>
          <div className="w-1/2 text-center">
            <h1 className="text-2xl print:text-xl font-bold uppercase">{w.company?.name || 'MOHAMMADI ELECTRIC WIRES & MULTI PRODUCTS (MEP) LTD.'}</h1>
            <h2 className="text-lg print:text-base font-bold underline mt-2 inline-block">Resign Benefits</h2>
          </div>
          <div className="w-1/4"></div>
        </div>

        {/* Worker Info Block */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-8 print:mb-4 text-[15px] print:text-[13px]">
          {/* Row 1 */}
          <div className="flex"><strong className="w-44 print:w-36">Name :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.name}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Grade :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.grade || ''}</span></div>

          {/* Row 2 */}
          <div className="flex"><strong className="w-44 print:w-36">ID :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.workerId}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Department :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.department?.name || ''}</span></div>
          
          {/* Row 3 */}
          <div className="flex"><strong className="w-44 print:w-36">Designation :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.designation || ''}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Section :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.section?.name || ''}</span></div>
          
          {/* Row 4 */}
          <div className="flex"><strong className="w-44 print:w-36">Join Date :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{formatDate(w.joinDate)}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Sub-Section :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{w.subSection?.name || ''}</span></div>
          
          {/* Row 5 */}
          <div className="flex"><strong className="w-44 print:w-36">Resign Apply Date :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{formatDate(settlement.resignApplyDate)}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Basic Salary :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{settlement.basicSalary || 0}</span></div>
          
          {/* Row 6 */}
          <div className="flex"><strong className="w-44 print:w-36">Last Working Day :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{formatDate(settlement.lastWorkingDay)}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">House Rent :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{settlement.houseRent || 0}</span></div>
          
          {/* Row 7 */}
          <div className="flex"><strong className="w-44 print:w-36">Service Age :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{settlement.serviceAge || ''}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Medical Allowance :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{settlement.medicalAllowance || 0}</span></div>
          
          {/* Row 8 */}
          <div className="flex"><strong className="w-44 print:w-36">Gross Salary :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{settlement.grossSalary || 0}</span></div>
          <div className="flex"><strong className="w-44 print:w-36">Conveyance Allowance :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{settlement.conveyanceAllowance || 0}</span></div>
        </div>

        {/* Leave & Work Day Info Block */}
        <h3 className="font-bold border-b border-black mb-3 print:mb-2 pb-1">Leave & work day info</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-8 print:mb-4 text-[15px] print:text-[13px]">
          <div className="flex"><strong className="w-64 print:w-48">Total Earn Leave :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.totalEarnLeaveDays || 0}</span> <span className="ml-2 w-16">Days</span></div>
          <div className="flex"><strong className="w-64 print:w-48">Total Late/ & Early Time :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.totalLateEarlyMinutes || 0}</span> <span className="ml-2 w-16">Minutes</span></div>
          
          <div className="flex"><strong className="w-64 print:w-48">Current month working days :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.currentMonthWorkingDays || 0}</span> <span className="ml-2 w-16">Days</span></div>
          <div className="flex"><strong className="w-64 print:w-48">Absent Days :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.absentDays || 0}</span> <span className="ml-2 w-16"></span></div>

          {(() => {
            let noticePeriodDue = 0;
            if (settlement.resignApplyDate && settlement.lastWorkingDay) {
              const rDate = new Date(settlement.resignApplyDate);
              const lDate = new Date(settlement.lastWorkingDay);
              if (!isNaN(rDate.getTime()) && !isNaN(lDate.getTime())) {
                const diffDays = Math.floor((lDate.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24));
                const shortfall = 60 - diffDays;
                if (shortfall > 0) noticePeriodDue = shortfall;
              }
            }
            return (
              <div className="flex"><strong className="w-64 print:w-48">Notice Period Due :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{noticePeriodDue > 0 ? noticePeriodDue : ''}</span> <span className="ml-2 w-16">{noticePeriodDue > 0 ? 'Days' : ''}</span></div>
            );
          })()}
        </div>

        {/* Pay calculation info */}
        <h3 className="font-bold border-b border-black mb-3 print:mb-2 pb-1">Pay calculation info</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-4 print:mb-2 text-[15px] print:text-[13px]">
          <div className="flex"><strong className="w-64 print:w-48 text-left">Service benefit amount :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.serviceBenefitAmount || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          <div className="flex"><strong className="w-64 print:w-48 text-left">Deduct Money (Act of 2006, sec 27) :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.deductMoneyAct2006 || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          
          <div className="flex"><strong className="w-64 print:w-48 text-left">Current month work day pay :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.currentMonthWorkDayPay || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          <div className="flex"><strong className="w-64 print:w-48 text-left">Absent Deduction :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.absentDeduction || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          
          <div className="flex"><strong className="w-64 print:w-48 text-left">Extra Duty/OT :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.extraDutyOTPay || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          <div className="flex"><strong className="w-64 print:w-48 text-left">Deduct from Late/ & Early Minutes :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.lateEarlyDeduction || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          
          <div className="flex"><strong className="w-64 print:w-48 text-left">Earn leave pay :</strong> <span className="border-b border-dashed border-gray-400 flex-1 text-center">{settlement.earnLeavePay || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          <div className="flex"></div>

          <div className="flex border-t border-black pt-2 print:pt-1 font-bold"><strong className="w-64 print:w-48 text-left">Sub total :</strong> <span className="flex-1 text-center">{settlement.payableSubTotal || 0}</span> <span className="ml-2 w-12">Taka</span></div>
          <div className="flex border-t border-black pt-2 print:pt-1 font-bold"><strong className="w-64 print:w-48 text-left">Sub total :</strong> <span className="flex-1 text-center">{settlement.deductionSubTotal || 0}</span> <span className="ml-2 w-12">Taka</span></div>
        </div>

        <div className="flex font-bold text-[16px] print:text-[14px] my-6 print:my-4">
          <strong className="w-64 print:w-48 text-left">Total Pay Amount :</strong> 
          <span className="flex-1 text-left">{settlement.totalPayAmount || 0} Taka</span>
        </div>

        <div className="flex font-bold text-[15px] print:text-[14px] mb-12 print:mb-6">
          <strong className="w-40 print:w-32 text-left">Amount in Word :</strong> 
          <span className="border-b border-dashed border-gray-400 flex-1 px-2">{settlement.amountInWords || ''}</span>
        </div>

        <div className="mt-16 print:mt-10 flex justify-start mb-8 print:mb-4">
          <div className="text-center font-bold text-[15px] print:text-[14px]">
            <div className="border-t border-dashed border-gray-500 w-80 print:w-64 pt-2">
              Payment Reciver Signeture with Date
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-4 gap-8 print:gap-4 mt-24 print:mt-16 text-center font-bold text-sm print:text-xs">
          <div className="border-t border-black pt-2">Prepared By</div>
          <div className="border-t border-black pt-2">Audit By</div>
          <div className="border-t border-black pt-2 px-2 leading-tight">Sr. Deputy Manager (HR & Admin)</div>
          <div className="border-t border-black pt-2">Approved By</div>
        </div>

      </div>
    </div>
  );
}

