'use client'

import { useState } from 'react';

type CompanyHierarchy = {
  id: string;
  name: string;
  departments: {
    id: string;
    name: string;
    sections: {
      id: string;
      name: string;
      subSections: {
        id: string;
        name: string;
      }[];
    }[];
  }[];
};

type Props = {
  companies: CompanyHierarchy[];
  initialCompanyId?: string;
  initialDepartmentId?: string;
  initialSectionId?: string;
  initialSubSectionId?: string;
};

export default function DynamicCompanySelectors({ 
  companies, 
  initialCompanyId = '',
  initialDepartmentId = '',
  initialSectionId = '',
  initialSubSectionId = ''
}: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [selectedDeptId, setSelectedDeptId] = useState(initialDepartmentId);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId);
  const [selectedSubSectionId, setSelectedSubSectionId] = useState(initialSubSectionId);

  const company = companies.find(c => c.id === selectedCompanyId);
  const depts = company?.departments || [];
  
  const dept = depts.find(d => d.id === selectedDeptId);
  const sections = dept?.sections || [];
  
  const section = sections.find(s => s.id === selectedSectionId);
  const subSections = section?.subSections || [];

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
        <select 
          name="companyId" 
          required 
          className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-white"
          value={selectedCompanyId}
          onChange={(e) => {
            setSelectedCompanyId(e.target.value);
            setSelectedDeptId('');
            setSelectedSectionId('');
            setSelectedSubSectionId('');
          }}
        >
          <option value="">Select Company</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <select 
          name="departmentId" 
          className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-white"
          value={selectedDeptId}
          onChange={(e) => {
            setSelectedDeptId(e.target.value);
            setSelectedSectionId('');
            setSelectedSubSectionId('');
          }}
          disabled={!selectedCompanyId}
        >
          <option value="">Select Department</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
        <select 
          name="sectionId" 
          className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-white"
          value={selectedSectionId}
          onChange={(e) => {
             setSelectedSectionId(e.target.value);
             setSelectedSubSectionId('');
          }}
          disabled={!selectedDeptId}
        >
          <option value="">Select Section</option>
          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Section</label>
        <select 
          name="subSectionId" 
          className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-white"
          value={selectedSubSectionId}
          onChange={(e) => setSelectedSubSectionId(e.target.value)}
          disabled={!selectedSectionId}
        >
          <option value="">Select Sub-Section</option>
          {subSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </>
  );
}
