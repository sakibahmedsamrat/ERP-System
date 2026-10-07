'use client';

import { useState } from 'react';

export default function SalaryFields({ 
  initialGross = '', 
  initialBasic = '', 
  initialHouse = '', 
  initialConveyance = '', 
  initialMedical = '' 
}: any) {
  const [gross, setGross] = useState<number | ''>(initialGross);
  const [basic, setBasic] = useState<number | ''>(initialBasic);
  const [house, setHouse] = useState<number | ''>(initialHouse);
  const [conveyance, setConveyance] = useState<number | ''>(initialConveyance);
  const [medical, setMedical] = useState<number | ''>(initialMedical);

  const handleGrossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      setGross('');
      setBasic('');
      setHouse('');
      setConveyance('');
      setMedical('');
      return;
    }

    setGross(val);
    setBasic(Math.round(val * 0.50));
    setHouse(Math.round(val * 0.30));
    setConveyance(Math.round(val * 0.10));
    setMedical(Math.round(val * 0.10));
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Salary Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
          <input 
            type="number" 
            name="grossSalary" 
            value={gross} 
            onChange={handleGrossChange}
            className="w-full border rounded p-2 outline-none focus:border-blue-500" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (50%)</label>
          <input 
            type="number" 
            name="basicSalary" 
            value={basic}
            onChange={(e) => setBasic(parseFloat(e.target.value) || '')}
            className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-gray-50" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House Rent (30%)</label>
          <input 
            type="number" 
            name="houseRent" 
            value={house}
            onChange={(e) => setHouse(parseFloat(e.target.value) || '')}
            className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-gray-50" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conveyance Allowance (10%)</label>
          <input 
            type="number" 
            name="conveyanceAllowance" 
            value={conveyance}
            onChange={(e) => setConveyance(parseFloat(e.target.value) || '')}
            className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-gray-50" 
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance (10%)</label>
          <input 
            type="number" 
            name="medicalAllowance" 
            value={medical}
            onChange={(e) => setMedical(parseFloat(e.target.value) || '')}
            className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-gray-50" 
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
