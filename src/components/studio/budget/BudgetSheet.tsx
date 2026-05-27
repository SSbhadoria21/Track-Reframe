'use client';

import { useBudgetStore } from '@/store/budgetStore';
import DepartmentCard from './DepartmentCard';
import ScriptContextPanel from './ScriptContextPanel';
import { Users, Search, Save, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BudgetSheet() {
  const { departments, projectData, crewCount, grandTotal, setStep } = useBudgetStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    
    const query = searchQuery.toLowerCase();
    return departments.map(dep => {
      // Check if department name matches
      if (dep.name.toLowerCase().includes(query)) return { ...dep, isExpanded: true };
      
      // Filter items
      const matchingItems = dep.items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.roleDescription?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
      
      if (matchingItems.length > 0) {
        return { ...dep, items: matchingItems, isExpanded: true };
      }
      return null;
    }).filter(Boolean) as typeof departments;
  }, [departments, searchQuery]);

  const handleSave = async () => {
    const loadingToast = toast.loading("Saving budget...");
    try {
      const payload = {
        projectData,
        departments,
        crewCount,
        grandTotal
      };

      let targetId = projectData.id;
      
      // If no ID exists, create the top-level budget first
      if (!targetId) {
        const createRes = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_title: projectData.title,
            project_type: projectData.type,
            budget_scope: projectData.scope,
            shoot_days: projectData.shootDays,
            shoot_start_date: projectData.startDate,
            currency: projectData.currency,
            production_scale: projectData.scale,
            contingency_percent: projectData.contingencyPercent,
            notes: projectData.notes,
            crew_count: crewCount,
            grand_total: grandTotal
          })
        });
        
        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create budget');
        }
        
        const createData = await createRes.json();
        targetId = createData.id;
        useBudgetStore.getState().updateProjectData({ id: targetId });
      }

      // ALWAYS perform a PUT to save the departments and line items using the upsert logic
      const res = await fetch(`/api/budgets/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to sync budget details');
      }
      


      toast.success("Budget saved successfully!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save budget", { id: loadingToast });
    }
  };

  const calculateCategoryTotal = (deps: typeof departments, categoryIds: number[]) => {
    return deps
      .filter(d => categoryIds.includes(d.order))
      .reduce((sum, d) => sum + d.subtotal, 0);
  };

  const aboveTheLineTotal = calculateCategoryTotal(departments, [1, 2, 3, 4]); // Basic heuristic for ATL
  const postTotal = calculateCategoryTotal(departments, [13, 14, 15]);
  const btlTotal = grandTotal - aboveTheLineTotal - postTotal - (grandTotal * (projectData.contingencyPercent / 100)); // rough BTL

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#111118] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(1)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{projectData.title || 'Untitled Budget'}</h1>
            <p className="text-xs text-gray-400">
              {projectData.scale} • {projectData.shootDays} Days • {projectData.currency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-full text-sm focus:outline-none focus:border-[#F5A623] w-64 transition-colors text-white"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-[#1A1A25] px-4 py-2 rounded-full border border-white/5">
            <Users className="w-4 h-4 text-[#F5A623]" />
            <span className="text-sm font-medium text-gray-300">
              Total Crew: <strong className="text-white">{crewCount}</strong>
            </span>
          </div>

          <button 
            onClick={handleSave}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          
          <button
            onClick={() => setStep(3)}
            className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold py-2 px-6 rounded-md flex items-center gap-2 transition-colors text-sm shadow-[0_0_15px_rgba(245,166,35,0.2)]"
          >
            Summary & Export
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (Navigation) */}
        <div className="w-64 bg-[#0A0A0F] border-r border-white/5 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-4 space-y-1">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Departments</div>
            {departments.map(dep => {
              const hasItems = dep.items.length > 0;
              const isComplete = hasItems && dep.subtotal > 0;
              return (
                <a 
                  key={dep.id}
                  href={`#dep-${dep.id}`}
                  className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 group transition-colors"
                >
                  <span className="text-sm text-gray-400 group-hover:text-white truncate pr-2">{dep.name}</span>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    isComplete ? 'bg-green-500' : hasItems ? 'bg-[#F5A623]' : 'bg-white/10'
                  }`} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
          <div className="max-w-5xl mx-auto space-y-4 pb-32">
            {filteredDepartments.length === 0 ? (
              <div className="text-center text-gray-500 py-20">
                No items match your search.
              </div>
            ) : (
              filteredDepartments.map((dep) => (
                <div key={dep.id} id={`dep-${dep.id}`} className="scroll-mt-6">
                  <DepartmentCard department={dep} />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Context Panel Drawer */}
        <ScriptContextPanel />

      </div>

      {/* Sticky Footer */}
      <div className="bg-[#111118] border-t border-[#F5A623]/30 px-6 py-4 flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 absolute bottom-0 left-0 right-0">
        
        <div className="flex items-center gap-8 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Above the Line</span>
            <span className="font-mono text-white">{formatMoney(aboveTheLineTotal, projectData.currency)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Below the Line (Est.)</span>
            <span className="font-mono text-white">{formatMoney(btlTotal, projectData.currency)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Post Production</span>
            <span className="font-mono text-white">{formatMoney(postTotal, projectData.currency)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#F5A623] text-xs">Contingency ({projectData.contingencyPercent}%)</span>
            <span className="font-mono text-[#F5A623]">
              {formatMoney(grandTotal * (projectData.contingencyPercent / 100), projectData.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Grand Total</div>
            <div className="text-2xl font-bold font-mono text-[#F5A623]">
              {formatMoney(grandTotal, projectData.currency)}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
