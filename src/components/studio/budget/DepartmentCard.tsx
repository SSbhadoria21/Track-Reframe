'use client';

import { Department, PaymentType } from '@/lib/budget-defaults';
import { useBudgetStore } from '@/store/budgetStore';
import { ChevronDown, ChevronRight, Plus, Trash2, Copy, GripVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // I need to create this util or just use Intl.NumberFormat

interface DepartmentCardProps {
  department: Department;
}

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DepartmentCard({ department }: DepartmentCardProps) {
  const { projectData, toggleDepartmentExpanded, addDepartmentItem, updateDepartmentItem, removeDepartmentItem } = useBudgetStore();

  const handleAddItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    addDepartmentItem(department.id, {
      name: '',
      roleDescription: '',
      paymentType: 'Daily',
      rate: 0,
      units: projectData.shootDays,
      notes: ''
    });
  };

  const handleDuplicate = (itemId: string) => {
    const item = department.items.find(i => i.id === itemId);
    if (item) {
      addDepartmentItem(department.id, {
        name: item.name + ' (Copy)',
        roleDescription: item.roleDescription,
        paymentType: item.paymentType,
        rate: item.rate,
        units: item.units,
        notes: item.notes
      });
    }
  };

  return (
    <div className={`bg-[#111118] border transition-all duration-300 rounded-xl overflow-hidden ${
      department.isExpanded ? 'border-l-4 border-l-[#F5A623] border-white/10 shadow-lg' : 'border-white/5 hover:border-white/10'
    }`}>
      
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02]"
        onClick={() => toggleDepartmentExpanded(department.id)}
      >
        <div className="flex items-center gap-3">
          {department.isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#F5A623]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <h3 className={`font-bold ${department.isExpanded ? 'text-white' : 'text-gray-300'}`}>
            {department.name}
          </h3>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
            {department.items.length} items
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-[#F5A623] font-medium">
            {formatMoney(department.subtotal, projectData.currency)}
          </span>
          <button 
            onClick={handleAddItem}
            className="p-1.5 hover:bg-[#F5A623]/20 rounded-md text-gray-400 hover:text-[#F5A623] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body / Table */}
      {department.isExpanded && (
        <div className="border-t border-white/5 p-1 animate-in slide-in-from-top-2 fade-in duration-200">
          {department.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No items added to this department yet.<br/>
              <button onClick={handleAddItem} className="mt-2 text-[#F5A623] hover:underline">Add first item</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-gray-500 border-b border-white/5 uppercase text-xs tracking-wider">
                    <th className="font-medium p-3 w-8"></th>
                    <th className="font-medium p-3 w-1/4">Name / Item</th>
                    <th className="font-medium p-3 w-1/5">Role / Desc</th>
                    <th className="font-medium p-3 w-[120px]">Type</th>
                    <th className="font-medium p-3 w-[100px]">Rate</th>
                    <th className="font-medium p-3 w-[80px]">Units</th>
                    <th className="font-medium p-3 w-[120px]">Subtotal</th>
                    <th className="font-medium p-3">Notes</th>
                    <th className="font-medium p-3 w-[80px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {department.items.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.02]">
                      <td className="p-3 text-gray-600 cursor-move">
                        <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="p-2">
                        <input 
                          className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#F5A623] focus:bg-[#0A0A0F] rounded px-2 py-1 outline-none transition-colors"
                          value={item.name}
                          placeholder="Name or Item..."
                          onChange={e => updateDepartmentItem(department.id, item.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#F5A623] focus:bg-[#0A0A0F] rounded px-2 py-1 outline-none transition-colors"
                          value={item.roleDescription}
                          placeholder="Description..."
                          onChange={e => updateDepartmentItem(department.id, item.id, { roleDescription: e.target.value })}
                        />
                      </td>
                      <td className="p-2">
                        <select 
                          className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#F5A623] focus:bg-[#0A0A0F] rounded px-2 py-1 outline-none text-sm text-gray-300 appearance-none"
                          value={item.paymentType}
                          onChange={e => updateDepartmentItem(department.id, item.id, { paymentType: e.target.value as PaymentType })}
                        >
                          <option className="bg-[#111118]">One-time</option>
                          <option className="bg-[#111118]">Daily</option>
                          <option className="bg-[#111118]">Weekly</option>
                          <option className="bg-[#111118]">Monthly</option>
                          <option className="bg-[#111118]">Hourly</option>
                          <option className="bg-[#111118]">Per Project</option>
                          <option className="bg-[#111118]">Deferred</option>
                          <option className="bg-[#111118]">In-Kind</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="number"
                          className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#F5A623] focus:bg-[#0A0A0F] rounded px-2 py-1 outline-none font-mono"
                          value={item.rate || ''}
                          placeholder="0"
                          onChange={e => updateDepartmentItem(department.id, item.id, { rate: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="p-2">
                        {['One-time', 'Per Project', 'Deferred', 'In-Kind'].includes(item.paymentType) ? (
                          <span className="px-3 text-gray-600">—</span>
                        ) : (
                          <input 
                            type="number"
                            className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#F5A623] focus:bg-[#0A0A0F] rounded px-2 py-1 outline-none font-mono"
                            value={item.units || ''}
                            onChange={e => updateDepartmentItem(department.id, item.id, { units: parseFloat(e.target.value) || 0 })}
                          />
                        )}
                      </td>
                      <td className="p-2 font-mono font-medium text-white">
                        {item.subtotal > 0 ? formatMoney(item.subtotal, projectData.currency) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="p-2">
                        <input 
                          className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-[#F5A623] focus:bg-[#0A0A0F] rounded px-2 py-1 outline-none text-xs text-gray-400"
                          value={item.notes}
                          placeholder="Notes..."
                          onChange={e => updateDepartmentItem(department.id, item.id, { notes: e.target.value })}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDuplicate(item.id)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                            title="Duplicate row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => removeDepartmentItem(department.id, item.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-2 border-t border-white/5 flex justify-between items-center bg-black/20 rounded-b-lg">
            <button 
              onClick={handleAddItem}
              className="text-sm text-[#F5A623] hover:bg-[#F5A623]/10 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
            <div className="text-sm text-gray-400 flex items-center gap-2 pr-4">
              Subtotal: 
              <span className="font-mono text-white font-bold tracking-tight">
                {formatMoney(department.subtotal, projectData.currency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
