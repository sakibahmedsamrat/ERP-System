'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Save, Check, RotateCcw } from 'lucide-react';
import { createSettlement } from '../actions';
import { useRouter } from 'next/navigation';

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
  };

  return convert(num).trim();
}

export default function NewSettlementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [resignApplyDate, setResignApplyDate] = useState('');
  const [serviceAge, setServiceAge] = useState('');

  useEffect(() => {
    if (selectedWorker?.joinDate && lastWorkingDay) {
      const start = new Date(selectedWorker.joinDate);
      const end = new Date(lastWorkingDay);
      if (end >= start) {
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
          months -= 1;
          const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
          days += prevMonth.getDate();
        }
        if (months < 0) {
          years -= 1;
          months += 12;
        }

        let parts = [];
        if (years > 0) parts.push(`${years} Years`);
        if (months > 0) parts.push(`${months} Months`);
        if (days > 0) parts.push(`${days} Days`);
        setServiceAge(parts.join(', ') || '0 Days');
        setServiceAgeYears(years);
        setServiceAgeMonths(months);
        setServiceAgeDays(days);
      } else {
        setServiceAge('Invalid Date');
        setServiceAgeYears(0);
        setServiceAgeMonths(0);
        setServiceAgeDays(0);
      }
    } else {
      setServiceAge('');
      setServiceAgeYears(0);
      setServiceAgeMonths(0);
      setServiceAgeDays(0);
    }
  }, [selectedWorker, lastWorkingDay]);

  // Form states for live calculation
  const [formVals, setFormVals] = useState({
    grossSalary: 0,
    basicSalary: 0,
    totalEarnLeaveDays: 0,
    currentMonthWorkingDays: 0,
    absentDays: 0,
    totalLateEarlyMinutes: 0,
    otHour: 0,
    extraDutyDays: 0,
    serviceBenefitAmount: 0,
    currentMonthWorkDayPay: 0,
    extraDutyOTPay: 0,
    earnLeavePay: 0,
    deductMoneyAct2006: 0,
    absentDeduction: 0,
    lateEarlyDeduction: 0,
  });

  const [serviceAgeYears, setServiceAgeYears] = useState(0);
  const [serviceAgeMonths, setServiceAgeMonths] = useState(0);
  const [serviceAgeDays, setServiceAgeDays] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/workers/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.workers || []);
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
  };

  const handleSelect = (worker: any) => {
    setSelectedWorker(worker);
    setSearchResults([]);
    setSearchQuery('');
    setFormVals(prev => ({
      ...prev,
      grossSalary: worker.grossSalary || 0,
      basicSalary: worker.basicSalary || 0
    }));
  };

  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormVals(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  useEffect(() => {
    setFormVals(prev => {
      let newEarnLeavePay = prev.earnLeavePay;
      let newServiceBenefit = prev.serviceBenefitAmount;
      let newCurrentMonthPay = prev.currentMonthWorkDayPay;
      let newLateEarlyDeduction = prev.lateEarlyDeduction;
      let newAbsentDeduction = prev.absentDeduction;

      let daysInMonth = 30; // fallback
      if (lastWorkingDay) {
        const lwd = new Date(lastWorkingDay);
        if (!isNaN(lwd.getTime())) {
          daysInMonth = new Date(lwd.getFullYear(), lwd.getMonth() + 1, 0).getDate();
        }
      }

      // 1. Earn leave pay = (Gross / 30) * Total Earn Leave
      if (prev.grossSalary > 0 && prev.totalEarnLeaveDays >= 0) {
        newEarnLeavePay = Math.round((prev.grossSalary / 30) * prev.totalEarnLeaveDays);
      }

      // 2. Service benefit amount based on serviceAgeYears
      if (prev.basicSalary > 0) {
        let perDayBasic = prev.basicSalary / 30;
        
        let isOver10 = serviceAgeYears > 10 || (serviceAgeYears === 10 && (serviceAgeMonths > 0 || serviceAgeDays > 0));
        let isOver3 = serviceAgeYears > 3 || (serviceAgeYears === 3 && (serviceAgeMonths > 0 || serviceAgeDays > 0));

        if (isOver10) {
          newServiceBenefit = Math.round(perDayBasic * (30 * serviceAgeYears));
        } else if (isOver3) {
          newServiceBenefit = Math.round(perDayBasic * (15 * serviceAgeYears));
        } else if (serviceAgeYears === 3) {
          newServiceBenefit = Math.round(perDayBasic * (7 * serviceAgeYears));
        } else {
          newServiceBenefit = 0;
        }
      }

      // 3. Current month work day pay = (Gross / daysInMonth) * currentMonthWorkDays
      if (prev.grossSalary > 0 && prev.currentMonthWorkingDays >= 0 && daysInMonth > 0) {
        newCurrentMonthPay = Math.round((prev.grossSalary / daysInMonth) * prev.currentMonthWorkingDays);
      }
      
      // 4. Late/Early Deduction = (Gross / daysInMonth / 8 / 60) * totalLateEarlyMinutes
      if (prev.grossSalary > 0 && prev.totalLateEarlyMinutes >= 0 && daysInMonth > 0) {
        newLateEarlyDeduction = Math.round((prev.grossSalary / daysInMonth / 8 / 60) * prev.totalLateEarlyMinutes);
      }

      // 5. Absent Deduction = (Gross / daysInMonth) * absentDays
      if (prev.grossSalary > 0 && prev.absentDays >= 0 && daysInMonth > 0) {
        newAbsentDeduction = Math.round((prev.grossSalary / daysInMonth) * prev.absentDays);
      }

      // 6. Deduct Money (Act of 2006)
      let newDeductMoneyAct2006 = prev.deductMoneyAct2006;
      if (prev.basicSalary > 0 && resignApplyDate && lastWorkingDay) {
        const resignDate = new Date(resignApplyDate);
        const lwdDate = new Date(lastWorkingDay);
        if (!isNaN(resignDate.getTime()) && !isNaN(lwdDate.getTime())) {
          const diffTime = lwdDate.getTime() - resignDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const D = diffDays;
          const shortfall = 60 - D;
          if (shortfall > 0) {
            newDeductMoneyAct2006 = Math.round(shortfall * (prev.basicSalary / 30));
          } else {
            newDeductMoneyAct2006 = 0;
          }
        }
      }

      // 7. Extra Duty / OT calculation
      let newExtraDutyOTPay = prev.extraDutyOTPay;
      if (selectedWorker?.grade === 'S' && prev.otHour >= 0 && prev.basicSalary > 0) {
        newExtraDutyOTPay = Math.round((prev.basicSalary / 104) * prev.otHour);
      } else if (selectedWorker?.grade === 'M' && prev.extraDutyDays >= 0) {
        newExtraDutyOTPay = Math.round(250 * prev.extraDutyDays);
      }

      return {
        ...prev,
        earnLeavePay: newEarnLeavePay,
        serviceBenefitAmount: newServiceBenefit,
        currentMonthWorkDayPay: newCurrentMonthPay,
        lateEarlyDeduction: newLateEarlyDeduction,
        absentDeduction: newAbsentDeduction,
        deductMoneyAct2006: newDeductMoneyAct2006,
        extraDutyOTPay: newExtraDutyOTPay
      };
    });
  }, [
    formVals.grossSalary, 
    formVals.basicSalary, 
    formVals.totalEarnLeaveDays, 
    formVals.currentMonthWorkingDays,
    formVals.totalLateEarlyMinutes,
    formVals.absentDays,
    formVals.otHour,
    formVals.extraDutyDays,
    serviceAgeYears,
    serviceAgeMonths,
    serviceAgeDays, 
    lastWorkingDay,
    resignApplyDate,
    selectedWorker?.grade
  ]);

  const payableSubTotal = formVals.serviceBenefitAmount + formVals.currentMonthWorkDayPay + formVals.extraDutyOTPay + formVals.earnLeavePay;
  const deductionSubTotal = formVals.deductMoneyAct2006 + formVals.absentDeduction + formVals.lateEarlyDeduction;
  const totalPayAmount = payableSubTotal - deductionSubTotal;

  const [amountInWords, setAmountInWords] = useState('');

  useEffect(() => {
    if (totalPayAmount > 0) {
      setAmountInWords(`${numberToWords(Math.round(totalPayAmount))} Taka Only.`);
    } else if (totalPayAmount < 0) {
      setAmountInWords(`Minus ${numberToWords(Math.abs(Math.round(totalPayAmount)))} Taka Only.`);
    } else {
      setAmountInWords('');
    }
  }, [totalPayAmount]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWorker) return alert('Please select an employee first.');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('workerId', selectedWorker.id);
    formData.append('payableSubTotal', payableSubTotal.toString());
    formData.append('deductionSubTotal', deductionSubTotal.toString());
    formData.append('totalPayAmount', totalPayAmount.toString());
    
    await createSettlement(formData);
    setLoading(false);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear the form?")) {
      setSelectedWorker(null);
      setSearchQuery('');
      setSearchResults([]);
      setLastWorkingDay('');
      setResignApplyDate('');
      setServiceAge('');
      setServiceAgeYears(0);
      setServiceAgeMonths(0);
      setServiceAgeDays(0);
      setAmountInWords('');
      setFormVals({
        grossSalary: 0,
        basicSalary: 0,
        totalEarnLeaveDays: 0,
        currentMonthWorkingDays: 0,
        absentDays: 0,
        totalLateEarlyMinutes: 0,
        serviceBenefitAmount: 0,
        currentMonthWorkDayPay: 0,
        extraDutyOTPay: 0,
        earnLeavePay: 0,
        deductMoneyAct2006: 0,
        absentDeduction: 0,
        lateEarlyDeduction: 0,
      });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Resign Benefits / Settlement</h1>
        <Link href="/settlements" className="text-blue-600 hover:underline">
          &larr; Back to Settlements
        </Link>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Search Employee</h2>
        <div className="flex gap-2 relative">
          <input 
            type="text" 
            placeholder="Search by ID, Name or Phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery.trim())}
            className="flex-1 border border-gray-300 rounded p-2 outline-none focus:border-blue-500"
          />
          <button 
            type="button"
            onClick={() => performSearch(searchQuery.trim())}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Search size={18} /> Search
          </button>
        </div>
        
        {isSearching && <div className="mt-4 text-gray-500">Searching...</div>}
        
        {searchResults.length > 0 && (
          <div className="mt-4 border rounded shadow-sm max-h-60 overflow-y-auto">
            {searchResults.map(w => (
              <div key={w.id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                <div>
                  <div className="font-bold">{w.name} (ID: {w.workerId})</div>
                  <div className="text-sm text-gray-500">{w.company?.name} - {w.department?.name} - {w.designation}</div>
                </div>
                <button 
                  onClick={() => handleSelect(w)}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"
                >
                  <Check size={16} /> Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Section */}
      {selectedWorker && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold uppercase text-gray-800">{selectedWorker.company?.name || 'MEP GROUP'}</h2>
            <h3 className="text-lg font-bold underline mt-2">Resign Benefits</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
            {/* Row 1 */}
            <div className="flex"><strong className="w-40">Name :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.name}</span></div>
            <div className="flex"><strong className="w-40">Grade :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.grade || ''}</span></div>

            {/* Row 2 */}
            <div className="flex"><strong className="w-40">ID :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.workerId}</span></div>
            <div className="flex"><strong className="w-40">Department :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.department?.name || ''}</span></div>
            
            {/* Row 3 */}
            <div className="flex"><strong className="w-40">Designation :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.designation || ''}</span></div>
            <div className="flex"><strong className="w-40">Section :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.section?.name || ''}</span></div>
            
            {/* Row 4 */}
            <div className="flex"><strong className="w-40">Join Date :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{formatDate(selectedWorker.joinDate)}</span></div>
            <div className="flex"><strong className="w-40">Sub-Section :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.subSection?.name || ''}</span></div>
            
            {/* Row 5 */}
            <div className="flex items-center"><strong className="w-40">Resign Apply Date :</strong> <input type="date" name="resignApplyDate" value={resignApplyDate} onChange={(e) => setResignApplyDate(e.target.value)} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-40">Basic Salary :</strong> <input type="number" name="basicSalary" value={formVals.basicSalary || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            
            {/* Row 6 */}
            <div className="flex items-center"><strong className="w-40">Last Working Day :</strong> <input type="date" name="lastWorkingDay" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-40">House Rent :</strong> <input type="number" name="houseRent" defaultValue={selectedWorker.houseRent || 0} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            
            {/* Row 7 */}
            <div className="flex items-center"><strong className="w-40">Service Age :</strong> <input type="text" name="serviceAge" value={serviceAge} readOnly className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 text-blue-700 font-bold" /></div>
            <div className="flex items-center"><strong className="w-40">Medical Allowance :</strong> <input type="number" name="medicalAllowance" defaultValue={selectedWorker.medicalAllowance || 0} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            
            {/* Row 8 */}
            <div className="flex items-center"><strong className="w-40">Gross Salary :</strong> <input type="number" name="grossSalary" value={formVals.grossSalary || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-40">Conveyance Allow :</strong> <input type="number" name="conveyanceAllowance" defaultValue={selectedWorker.conveyanceAllowance || 0} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
          </div>

          <h4 className="font-bold text-gray-800 bg-gray-100 p-2 mb-4">Leave & work day info</h4>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div className="flex items-center"><strong className="w-48 text-sm">Total Earn Leave (Days) :</strong> <input type="number" name="totalEarnLeaveDays" value={formVals.totalEarnLeaveDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-48 text-sm">Total Late/Early (Min) :</strong> <input type="number" name="totalLateEarlyMinutes" value={formVals.totalLateEarlyMinutes || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-48 text-sm">Current month work days :</strong> <input type="number" name="currentMonthWorkingDays" value={formVals.currentMonthWorkingDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-48 text-sm">Absent Days :</strong> <input type="number" name="absentDays" value={formVals.absentDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            {selectedWorker.grade === 'S' && (
              <div className="flex items-center"><strong className="w-48 text-sm">OT Hour :</strong> <input type="number" name="otHour" value={formVals.otHour || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            )}
            {selectedWorker.grade === 'M' && (
              <div className="flex items-center"><strong className="w-48 text-sm">Extra Duty Days :</strong> <input type="number" name="extraDutyDays" value={formVals.extraDutyDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            )}
            {(() => {
              let noticePeriodDue = 0;
              if (resignApplyDate && lastWorkingDay) {
                const rDate = new Date(resignApplyDate);
                const lDate = new Date(lastWorkingDay);
                if (!isNaN(rDate.getTime()) && !isNaN(lDate.getTime())) {
                  const diffDays = Math.floor((lDate.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24));
                  const shortfall = 60 - diffDays;
                  if (shortfall > 0) noticePeriodDue = shortfall;
                }
              }
              return (
                <div className="flex items-center">
                  <strong className="w-48 text-sm text-red-600">Notice Period Due :</strong> 
                  <span className="border-b border-dashed border-gray-400 flex-1 px-1 text-red-600 font-bold bg-red-50">
                    {noticePeriodDue > 0 ? `${noticePeriodDue} Days` : ''}
                  </span>
                </div>
              );
            })()}
          </div>

          <h4 className="font-bold text-gray-800 bg-gray-100 p-2 mb-4">Pay calculation info</h4>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
            <div className="flex items-center"><strong className="w-56 text-sm">Service benefit amount :</strong> <input type="number" name="serviceBenefitAmount" value={formVals.serviceBenefitAmount || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            <div className="flex items-center"><strong className="w-56 text-sm text-red-600">Deduct Money (Act of 2006) :</strong> <input type="number" name="deductMoneyAct2006" value={formVals.deductMoneyAct2006 || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 text-red-600 bg-red-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            
            <div className="flex items-center"><strong className="w-56 text-sm">Current month work day pay :</strong> <input type="number" name="currentMonthWorkDayPay" value={formVals.currentMonthWorkDayPay || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            <div className="flex items-center"><strong className="w-56 text-sm text-red-600">Absent Deduction :</strong> <input type="number" name="absentDeduction" value={formVals.absentDeduction || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 text-red-600 bg-red-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            
            <div className="flex items-center"><strong className="w-56 text-sm">Extra Duty/OT :</strong> <input type="number" name="extraDutyOTPay" value={formVals.extraDutyOTPay || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            <div className="flex items-center"><strong className="w-56 text-sm text-red-600">Deduct from Late/Early Min :</strong> <input type="number" name="lateEarlyDeduction" value={formVals.lateEarlyDeduction || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 text-red-600 bg-red-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            
            <div className="flex items-center"><strong className="w-56 text-sm">Earn leave pay :</strong> <input type="number" name="earnLeavePay" value={formVals.earnLeavePay || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            <div className="flex items-center"></div>

            <div className="flex items-center font-bold border-t pt-2 border-gray-300 mt-2"><strong className="w-56">Sub total (Payable) :</strong> <span className="border-b border-dashed border-gray-400 flex-1 px-1">{payableSubTotal}</span> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
            <div className="flex items-center font-bold border-t pt-2 border-gray-300 mt-2 text-red-700"><strong className="w-56">Sub total (Deductions) :</strong> <span className="border-b border-dashed border-red-300 flex-1 px-1">{deductionSubTotal}</span> <span className="text-gray-500 ml-2 text-xs">Taka</span></div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg my-6 flex items-center justify-between border border-blue-100">
            <strong className="text-lg">Total Pay Amount :</strong>
            <div className="text-2xl font-bold text-blue-700">{totalPayAmount} <span className="text-sm font-normal text-gray-500">Taka</span></div>
          </div>

          <div className="flex items-center mb-10">
            <strong className="w-40">Amount in Word :</strong> <input type="text" name="amountInWords" value={amountInWords} onChange={(e) => setAmountInWords(e.target.value)} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" />
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-between items-center gap-4">
            <button 
              type="button" 
              onClick={handleReset}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition flex items-center gap-2"
            >
              <RotateCcw size={20} />
              Reset Form
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Settlement'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}

