'use client';

import { useState, useEffect } from 'react';
import { formatDate, calculateServiceAge, parseFlexibleDate, getPayrollCycleDays } from '@/lib/formatDate';
import Link from 'next/link';
import { Search, Save, Check, RotateCcw, Calculator, RefreshCw } from 'lucide-react';
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
  const [joinDateOverride, setJoinDateOverride] = useState('');
  const [serviceAge, setServiceAge] = useState('');
  const [isDateInverted, setIsDateInverted] = useState(false);

  // Track which fields the user has manually edited/overridden
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (manualOverrides.serviceAge) return;
    const effectiveJoin = joinDateOverride || selectedWorker?.joinDate;
    if (effectiveJoin && lastWorkingDay) {
      const res = calculateServiceAge(effectiveJoin, lastWorkingDay);
      if (res.isValid) {
        setServiceAge(res.text);
        setServiceAgeYears(res.years);
        setServiceAgeMonths(res.months);
        setServiceAgeDays(res.days);
        setIsDateInverted(res.isInverted);
      } else {
        setServiceAge('');
        setServiceAgeYears(0);
        setServiceAgeMonths(0);
        setServiceAgeDays(0);
        setIsDateInverted(false);
      }
    } else {
      setServiceAge('');
      setServiceAgeYears(0);
      setServiceAgeMonths(0);
      setServiceAgeDays(0);
      setIsDateInverted(false);
    }
  }, [selectedWorker, lastWorkingDay, joinDateOverride, manualOverrides.serviceAge]);

  // Form states for live calculation
  const [formVals, setFormVals] = useState({
    grossSalary: 0,
    basicSalary: 0,
    houseRent: 0,
    medicalAllowance: 0,
    conveyanceAllowance: 0,
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
    payableSubTotal: 0,
    deductionSubTotal: 0,
    totalPayAmount: 0,
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
    setManualOverrides({});
    if (worker.joinDate) {
      const parsed = parseFlexibleDate(worker.joinDate);
      if (parsed) {
        setJoinDateOverride(parsed.toISOString().split('T')[0]);
      } else {
        setJoinDateOverride('');
      }
    } else {
      setJoinDateOverride('');
    }
    setFormVals(prev => ({
      ...prev,
      grossSalary: worker.grossSalary || 0,
      basicSalary: worker.basicSalary || 0,
      houseRent: worker.houseRent || 0,
      medicalAllowance: worker.medicalAllowance || 0,
      conveyanceAllowance: worker.conveyanceAllowance || 0,
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
      payableSubTotal: 0,
      deductionSubTotal: 0,
      totalPayAmount: 0,
    }));
  };

  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numVal = value === '' ? 0 : parseFloat(value);
    setManualOverrides(prev => ({ ...prev, [name]: true }));
    setFormVals(prev => ({
      ...prev,
      [name]: isNaN(numVal) ? 0 : numVal
    }));
  };

  // Re-calculate fields automatically, respecting any manual overrides
  useEffect(() => {
    setFormVals(prev => {
      let newEarnLeavePay = prev.earnLeavePay;
      let newServiceBenefit = prev.serviceBenefitAmount;
      let newCurrentMonthPay = prev.currentMonthWorkDayPay;
      let newLateEarlyDeduction = prev.lateEarlyDeduction;
      let newAbsentDeduction = prev.absentDeduction;
      let newDeductMoneyAct2006 = prev.deductMoneyAct2006;
      let newExtraDutyOTPay = prev.extraDutyOTPay;

      let daysInMonth = 30; // fallback
      if (lastWorkingDay) {
        const cycleInfo = getPayrollCycleDays(lastWorkingDay);
        daysInMonth = cycleInfo.daysInCycle;
      }

      // 1. Earn leave pay = (Gross / 30) * Total Earn Leave
      if (!manualOverrides.earnLeavePay) {
        if (prev.grossSalary > 0 && prev.totalEarnLeaveDays >= 0) {
          newEarnLeavePay = Math.round((prev.grossSalary / 30) * prev.totalEarnLeaveDays);
        } else {
          newEarnLeavePay = 0;
        }
      }

      // 2. Service benefit amount based on serviceAgeYears
      if (!manualOverrides.serviceBenefitAmount) {
        if (prev.basicSalary > 0 && !isDateInverted) {
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
        } else {
          newServiceBenefit = 0;
        }
      }

      // 3. Current month work day pay = (Gross / daysInMonth) * currentMonthWorkDays
      if (!manualOverrides.currentMonthWorkDayPay) {
        if (prev.grossSalary > 0 && prev.currentMonthWorkingDays >= 0 && daysInMonth > 0) {
          newCurrentMonthPay = Math.round((prev.grossSalary / daysInMonth) * prev.currentMonthWorkingDays);
        } else {
          newCurrentMonthPay = 0;
        }
      }
      
      // 4. Late/Early Deduction = (Gross / daysInMonth / 8 / 60) * totalLateEarlyMinutes
      if (!manualOverrides.lateEarlyDeduction) {
        if (prev.grossSalary > 0 && prev.totalLateEarlyMinutes >= 0 && daysInMonth > 0) {
          newLateEarlyDeduction = Math.round((prev.grossSalary / daysInMonth / 8 / 60) * prev.totalLateEarlyMinutes);
        } else {
          newLateEarlyDeduction = 0;
        }
      }

      // 5. Absent Deduction = (Gross / daysInMonth) * absentDays
      if (!manualOverrides.absentDeduction) {
        if (prev.grossSalary > 0 && prev.absentDays >= 0 && daysInMonth > 0) {
          newAbsentDeduction = Math.round((prev.grossSalary / daysInMonth) * prev.absentDays);
        } else {
          newAbsentDeduction = 0;
        }
      }

      // 6. Deduct Money (Act of 2006)
      if (!manualOverrides.deductMoneyAct2006) {
        if (prev.basicSalary > 0 && resignApplyDate && lastWorkingDay) {
          const resignDate = new Date(resignApplyDate);
          const lwdDate = new Date(lastWorkingDay);
          if (!isNaN(resignDate.getTime()) && !isNaN(lwdDate.getTime())) {
            const diffTime = lwdDate.getTime() - resignDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const shortfall = Math.min(60, Math.max(0, 60 - diffDays));
            if (shortfall > 0) {
              newDeductMoneyAct2006 = Math.round(shortfall * (prev.basicSalary / 30));
            } else {
              newDeductMoneyAct2006 = 0;
            }
          }
        } else {
          newDeductMoneyAct2006 = 0;
        }
      }

      // 7. Extra Duty / OT calculation
      if (!manualOverrides.extraDutyOTPay) {
        if (selectedWorker?.grade === 'S' && prev.otHour >= 0 && prev.basicSalary > 0) {
          newExtraDutyOTPay = Math.round((prev.basicSalary / 104) * prev.otHour);
        } else if (selectedWorker?.grade === 'M' && prev.extraDutyDays >= 0) {
          newExtraDutyOTPay = Math.round(250 * prev.extraDutyDays);
        } else {
          newExtraDutyOTPay = 0;
        }
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
    selectedWorker?.grade,
    isDateInverted,
    manualOverrides
  ]);

  const payrollCycle = lastWorkingDay ? getPayrollCycleDays(lastWorkingDay) : null;
  const daysInCycle = payrollCycle ? payrollCycle.daysInCycle : 30;

  // Compute subtotals and total, allowing manual override if the user edited them directly
  const calculatedPayableSubTotal = 
    (Number(formVals.serviceBenefitAmount) || 0) + 
    (Number(formVals.currentMonthWorkDayPay) || 0) + 
    (Number(formVals.extraDutyOTPay) || 0) + 
    (Number(formVals.earnLeavePay) || 0);

  const payableSubTotal = manualOverrides.payableSubTotal 
    ? (Number(formVals.payableSubTotal) || 0)
    : calculatedPayableSubTotal;

  const calculatedDeductionSubTotal = 
    (Number(formVals.deductMoneyAct2006) || 0) + 
    (Number(formVals.absentDeduction) || 0) + 
    (Number(formVals.lateEarlyDeduction) || 0);

  const deductionSubTotal = manualOverrides.deductionSubTotal 
    ? (Number(formVals.deductionSubTotal) || 0)
    : calculatedDeductionSubTotal;

  const calculatedTotalPayAmount = payableSubTotal - deductionSubTotal;

  const totalPayAmount = manualOverrides.totalPayAmount 
    ? (Number(formVals.totalPayAmount) || 0)
    : calculatedTotalPayAmount;

  const [amountInWords, setAmountInWords] = useState('');
  const [bankAccNo, setBankAccNo] = useState('');

  // Auto-generate words unless user manually edited amountInWords
  useEffect(() => {
    if (manualOverrides.amountInWords) return;
    if (totalPayAmount > 0) {
      setAmountInWords(`${numberToWords(Math.round(totalPayAmount))} Taka Only.`);
    } else if (totalPayAmount < 0) {
      setAmountInWords(`Minus ${numberToWords(Math.abs(Math.round(totalPayAmount)))} Taka Only.`);
    } else {
      setAmountInWords('');
    }
  }, [totalPayAmount, manualOverrides.amountInWords]);

  // Reset all manual overrides back to automatic formula
  const resetToAutoCalculation = () => {
    setManualOverrides({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWorker) return alert('Please select an employee first.');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('workerId', selectedWorker.id);
    formData.set('grossSalary', (formVals.grossSalary || 0).toString());
    formData.set('basicSalary', (formVals.basicSalary || 0).toString());
    formData.set('houseRent', (formVals.houseRent || 0).toString());
    formData.set('medicalAllowance', (formVals.medicalAllowance || 0).toString());
    formData.set('conveyanceAllowance', (formVals.conveyanceAllowance || 0).toString());
    formData.set('serviceBenefitAmount', (formVals.serviceBenefitAmount || 0).toString());
    formData.set('deductMoneyAct2006', (formVals.deductMoneyAct2006 || 0).toString());
    formData.set('currentMonthWorkDayPay', (formVals.currentMonthWorkDayPay || 0).toString());
    formData.set('absentDeduction', (formVals.absentDeduction || 0).toString());
    formData.set('extraDutyOTPay', (formVals.extraDutyOTPay || 0).toString());
    formData.set('lateEarlyDeduction', (formVals.lateEarlyDeduction || 0).toString());
    formData.set('earnLeavePay', (formVals.earnLeavePay || 0).toString());
    formData.set('payableSubTotal', payableSubTotal.toString());
    formData.set('deductionSubTotal', deductionSubTotal.toString());
    formData.set('totalPayAmount', totalPayAmount.toString());
    formData.set('amountInWords', amountInWords);
    formData.set('bankAccNo', bankAccNo);
    formData.set('serviceAge', serviceAge);
    
    const res = await createSettlement(formData);
    if (res?.error) {
      alert(res.error);
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear the form?")) {
      setSelectedWorker(null);
      setSearchQuery('');
      setSearchResults([]);
      setLastWorkingDay('');
      setResignApplyDate('');
      setJoinDateOverride('');
      setIsDateInverted(false);
      setServiceAge('');
      setServiceAgeYears(0);
      setServiceAgeMonths(0);
      setServiceAgeDays(0);
      setAmountInWords('');
      setBankAccNo('');
      setManualOverrides({});
      setFormVals({
        grossSalary: 0,
        basicSalary: 0,
        houseRent: 0,
        medicalAllowance: 0,
        conveyanceAllowance: 0,
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
        payableSubTotal: 0,
        deductionSubTotal: 0,
        totalPayAmount: 0,
      });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">New Settlement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Any manual edits made to fields after automatic calculation will be saved.
          </p>
        </div>
        <Link href="/settlements" className="text-blue-600 hover:underline">
          &larr; Back to Settlements
        </Link>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee by Name, ID, or Phone</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Type at least 2 characters..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
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
            <div className="flex items-center">
              <strong className="w-40">Join Date :</strong>
              <input
                type="date"
                name="joinDate"
                value={joinDateOverride}
                onChange={(e) => setJoinDateOverride(e.target.value)}
                className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50"
                title="Employee Join Date (editable if adjustments needed)"
              />
            </div>
            <div className="flex"><strong className="w-40">Sub-Section :</strong> <span className="border-b border-dashed border-gray-400 flex-1">{selectedWorker.subSection?.name || ''}</span></div>
            
            {/* Row 5 */}
            <div className="flex items-center"><strong className="w-40">Resign Apply Date :</strong> <input type="date" name="resignApplyDate" value={resignApplyDate} onChange={(e) => setResignApplyDate(e.target.value)} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-40">Basic Salary :</strong> <input type="number" name="basicSalary" value={formVals.basicSalary || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            
            {/* Row 6 */}
            <div className="flex items-center"><strong className="w-40">Last Working Day :</strong> <input type="date" name="lastWorkingDay" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-40">House Rent :</strong> <input type="number" name="houseRent" value={formVals.houseRent || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            
            {/* Row 7 */}
            <div className="flex items-center">
              <strong className="w-40">Service Age :</strong>
              <div className="flex-1 flex flex-col">
                <input
                  type="text"
                  name="serviceAge"
                  value={serviceAge}
                  onChange={(e) => {
                    setServiceAge(e.target.value);
                    setManualOverrides(prev => ({ ...prev, serviceAge: true }));
                    const m = e.target.value.match(/(\d+)\s*(?:years|year|yr)/i);
                    if (m) setServiceAgeYears(parseInt(m[1], 10));
                  }}
                  className="border-b border-dashed border-gray-400 w-full outline-none px-1 bg-gray-50 text-blue-700 font-bold"
                  placeholder="Auto-calculated or enter manually..."
                />
                {isDateInverted && (
                  <span className="text-[11px] text-amber-600 font-semibold mt-0.5">
                    ⚠️ Note: Last Working Day is earlier than Join Date. Please verify.
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center"><strong className="w-40">Medical Allowance :</strong> <input type="number" name="medicalAllowance" value={formVals.medicalAllowance || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            
            {/* Row 8 */}
            <div className="flex items-center"><strong className="w-40">Gross Salary :</strong> <input type="number" name="grossSalary" value={formVals.grossSalary || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-40">Conveyance Allow :</strong> <input type="number" name="conveyanceAllowance" value={formVals.conveyanceAllowance || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-2 mb-4 gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-800">Leave & work day info</h4>
              {payrollCycle && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                  {payrollCycle.monthName}
                </span>
              )}
            </div>
            {payrollCycle && (
              <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded font-semibold">
                🗓️ Salary Month ({payrollCycle.monthName}): {formatDate(payrollCycle.cycleStart)} to {formatDate(payrollCycle.cycleEnd)} ({payrollCycle.daysInCycle} Days)
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div className="flex items-center"><strong className="w-48 text-sm">Total Earn Leave (Days) :</strong> <input type="number" name="totalEarnLeaveDays" value={formVals.totalEarnLeaveDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-48 text-sm">Total Late/Early (Min) :</strong> <input type="number" name="totalLateEarlyMinutes" value={formVals.totalLateEarlyMinutes || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /></div>
            <div className="flex items-center"><strong className="w-48 text-sm">Current month work days {payrollCycle ? `(${payrollCycle.monthName})` : ''} :</strong> <input type="number" name="currentMonthWorkingDays" value={formVals.currentMonthWorkingDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /> <span className="text-xs text-gray-500 ml-1">/ {daysInCycle} Days</span></div>
            <div className="flex items-center"><strong className="w-48 text-sm">Absent Days :</strong> <input type="number" name="absentDays" value={formVals.absentDays || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" /> <span className="text-xs text-gray-500 ml-1">/ {daysInCycle} Days</span></div>
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

          <div className="flex items-center justify-between bg-gray-100 p-2 mb-4">
            <h4 className="font-bold text-gray-800">Pay calculation info</h4>
            {Object.keys(manualOverrides).length > 0 && (
              <button
                type="button"
                onClick={resetToAutoCalculation}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-white px-2.5 py-1 rounded border shadow-sm transition"
                title="Reset manual entries and recalculate using formulas"
              >
                <RefreshCw size={12} />
                🔄 Re-calculate All Automatically
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-4">
            <div className="flex items-center">
              <strong className="w-56 text-sm flex items-center gap-1">
                Service benefit amount :
                {manualOverrides.serviceBenefitAmount && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="serviceBenefitAmount" value={formVals.serviceBenefitAmount || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>
            
            <div className="flex items-center">
              <strong className="w-56 text-sm text-red-600 flex items-center gap-1">
                Deduct Money (Act of 2006) :
                {manualOverrides.deductMoneyAct2006 && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="deductMoneyAct2006" value={formVals.deductMoneyAct2006 || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 text-red-600 bg-red-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>
            
            <div className="flex items-center">
              <strong className="w-56 text-sm flex items-center gap-1">
                Current month {payrollCycle ? `(${payrollCycle.monthName})` : ''} work day pay :
                {manualOverrides.currentMonthWorkDayPay && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="currentMonthWorkDayPay" value={formVals.currentMonthWorkDayPay || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka ({daysInCycle}d)</span>
            </div>
            
            <div className="flex items-center">
              <strong className="w-56 text-sm text-red-600 flex items-center gap-1">
                Absent Deduction :
                {manualOverrides.absentDeduction && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="absentDeduction" value={formVals.absentDeduction || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 text-red-600 bg-red-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka ({daysInCycle}d)</span>
            </div>
            
            <div className="flex items-center">
              <strong className="w-56 text-sm flex items-center gap-1">
                Extra Duty/OT :
                {manualOverrides.extraDutyOTPay && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="extraDutyOTPay" value={formVals.extraDutyOTPay || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>
            
            <div className="flex items-center">
              <strong className="w-56 text-sm text-red-600 flex items-center gap-1">
                Deduct from Late/Early Min :
                {manualOverrides.lateEarlyDeduction && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="lateEarlyDeduction" value={formVals.lateEarlyDeduction || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 text-red-600 bg-red-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>
            
            <div className="flex items-center">
              <strong className="w-56 text-sm flex items-center gap-1">
                Earn leave pay :
                {manualOverrides.earnLeavePay && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input type="number" name="earnLeavePay" value={formVals.earnLeavePay || ''} onChange={handleValChange} className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 font-medium" /> 
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>
            <div className="flex items-center"></div>

            {/* Sub total (Payable) */}
            <div className="flex items-center font-bold border-t pt-2 border-gray-300 mt-2">
              <strong className="w-56 flex items-center gap-1">
                Sub total (Payable) :
                {manualOverrides.payableSubTotal && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input 
                type="number" 
                name="payableSubTotal" 
                value={payableSubTotal || ''} 
                onChange={handleValChange} 
                className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 font-bold text-gray-900" 
              />
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>

            {/* Sub total (Deductions) */}
            <div className="flex items-center font-bold border-t pt-2 border-gray-300 mt-2 text-red-700">
              <strong className="w-56 flex items-center gap-1">
                Sub total (Deductions) :
                {manualOverrides.deductionSubTotal && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
              </strong> 
              <input 
                type="number" 
                name="deductionSubTotal" 
                value={deductionSubTotal || ''} 
                onChange={handleValChange} 
                className="border-b border-dashed border-red-300 flex-1 outline-none px-1 text-red-600 bg-red-50 font-bold" 
              />
              <span className="text-gray-500 ml-2 text-xs">Taka</span>
            </div>
          </div>

          {/* Total Pay Amount */}
          <div className="bg-blue-50 p-4 rounded-lg my-6 flex items-center justify-between border border-blue-100">
            <div>
              <strong className="text-lg">Total Pay Amount :</strong>
              {manualOverrides.totalPayAmount && (
                <span className="ml-2 text-xs text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                  Manual Entry
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="totalPayAmount"
                value={totalPayAmount || ''}
                onChange={handleValChange}
                className="text-2xl font-bold text-blue-700 bg-white border border-blue-300 rounded px-2 py-1 outline-none text-right w-44 shadow-inner"
              />
              <span className="text-sm font-semibold text-gray-600">Taka</span>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <strong className="w-40 flex items-center gap-1">
              Amount in Word :
              {manualOverrides.amountInWords && <span className="text-[10px] text-amber-600 font-normal">(Manual)</span>}
            </strong> 
            <input 
              type="text" 
              name="amountInWords" 
              value={amountInWords} 
              onChange={(e) => {
                setAmountInWords(e.target.value);
                setManualOverrides(prev => ({ ...prev, amountInWords: true }));
              }} 
              className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50" 
            />
          </div>

          <div className="flex items-center mb-10">
            <strong className="w-40">Banck Acc. No. :</strong> 
            <input 
              type="text" 
              name="bankAccNo" 
              value={bankAccNo} 
              onChange={(e) => setBankAccNo(e.target.value)} 
              placeholder="Enter Bank Account Number" 
              className="border-b border-dashed border-gray-400 flex-1 outline-none px-1 bg-gray-50 font-medium text-gray-800" 
            />
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
