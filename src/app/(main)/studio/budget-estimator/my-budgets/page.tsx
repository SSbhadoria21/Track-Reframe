'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { FolderKanban, Plus, Clock, Copy, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBudgetStore } from '@/store/budgetStore';
import { useRouter } from 'next/navigation';

export default function MyBudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setStep } = useBudgetStore();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setStep(1); // Reset to first step
    router.push('/studio/budget-estimator');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this budget?")) return;
    
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBudgets(budgets.filter(b => b.id !== id));
        toast.success("Budget deleted");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete budget");
    }
  };

  const handleDuplicate = async (budget: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast.loading("Duplicating budget...", { id: 'dup' });
    try {
      // Create new budget with same properties
      const newBudget = {
        project_title: `${budget.project_title} (Copy)`,
        project_type: budget.project_type,
        budget_scope: budget.budget_scope,
        shoot_days: budget.shoot_days,
        currency: budget.currency,
        production_scale: budget.production_scale,
        contingency_percent: budget.contingency_percent,
        notes: budget.notes
      };
      
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudget)
      });
      
      if (res.ok) {
        toast.success("Budget duplicated!", { id: 'dup' });
        fetchBudgets();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Failed to duplicate budget", { id: 'dup' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 lg:p-10">
      
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pt-10">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
              <span>›</span>
              <Link href="/studio/budget-estimator" className="hover:text-white transition-colors">Budget Estimator</Link>
              <span>›</span>
              <span className="text-white">My Budgets</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-[#F5A623]" />
              My Saved Budgets
            </h1>
          </div>
          
          <button 
            onClick={handleCreateNew}
            className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,166,35,0.2)]"
          >
            <Plus className="w-5 h-5" /> New Budget
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-20 bg-[#111118] border border-white/5 rounded-2xl">
            <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No budgets found</h3>
            <p className="text-gray-400 mb-6">You haven't created any budget estimates yet.</p>
            <button 
              onClick={handleCreateNew}
              className="text-[#F5A623] hover:underline flex items-center gap-1 justify-center mx-auto"
            >
              Create your first budget <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map(budget => (
              <div 
                key={budget.id}
                className="bg-[#111118] border border-white/10 rounded-2xl p-6 hover:border-[#F5A623]/50 transition-colors group flex flex-col h-full"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-[#F5A623] transition-colors">
                      {budget.project_title}
                    </h3>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300 whitespace-nowrap ml-2">
                      {budget.project_type}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-gray-400 flex justify-between">
                      <span>Total:</span>
                      <span className="font-mono text-white font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: budget.currency || 'USD', maximumFractionDigits: 0 }).format(budget.grand_total || 0)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 flex justify-between">
                      <span>Crew:</span>
                      <span className="text-white">{budget.crew_count || 0} members</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 pt-4 border-t border-white/5">
                    <Clock className="w-3.5 h-3.5" />
                    Last edited {format(new Date(budget.updated_at), 'MMM d, yyyy')}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <button 
                    onClick={() => router.push(`/studio/budget-estimator?id=${budget.id}`)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Open
                  </button>
                  <button 
                    onClick={(e) => handleDuplicate(budget, e)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(budget.id, e)}
                    className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
