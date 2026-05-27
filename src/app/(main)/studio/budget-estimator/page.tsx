'use client';

import { useBudgetStore } from '@/store/budgetStore';
import ProjectSetup from '@/components/studio/budget/ProjectSetup';
import BudgetSheet from '@/components/studio/budget/BudgetSheet';
import BudgetSummary from '@/components/studio/budget/BudgetSummary';
import { useEffect, Suspense } from 'react';
import { getDefaultDepartments } from '@/lib/budget-defaults';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

function BudgetEstimatorContent() {
  const { currentStep, setStep, updateProjectData, setDepartments } = useBudgetStore();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      toast.loading("Loading budget...", { id: 'load' });
      fetch(`/api/budgets/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          
          updateProjectData({
            id: data.id,
            title: data.project_title,
            type: data.project_type,
            scope: data.budget_scope,
            shootDays: data.shoot_days,
            startDate: data.shoot_start_date,
            currency: data.currency,
            scale: data.production_scale,
            contingencyPercent: data.contingency_percent,
            notes: data.notes
          });
          
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
          } else {
            setDepartments(getDefaultDepartments());
          }
          
          setStep(2);
          toast.success("Budget loaded", { id: 'load' });
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load budget", { id: 'load' });
        });
    }
  }, [id]);

  // Ensuring the dark theme is applied fully
  useEffect(() => {
    document.body.style.backgroundColor = '#0A0A0F';
    document.body.style.color = '#ffffff';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden relative selection:bg-[#F5A623]/30">
      
      {/* Navigation Breadcrumb (Only visible in Step 1 and 3, Step 2 has its own top bar) */}
      {currentStep !== 2 && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
            <span>›</span>
            <span className="text-white">Budget Estimator</span>
          </div>
          <Link 
            href="/studio/budget-estimator/my-budgets"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg bg-[#111118]"
          >
            <FolderKanban className="w-4 h-4" />
            My Budgets
          </Link>
        </div>
      )}

      {/* Main Container - conditional padding based on step */}
      <div className={`${currentStep !== 2 ? 'pt-24 px-6' : ''}`}>
        {currentStep === 1 && <ProjectSetup />}
        {currentStep === 2 && <BudgetSheet />}
        {currentStep === 3 && <BudgetSummary />}
      </div>
      
    </div>
  );
}

export default function BudgetEstimatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center">Loading...</div>}>
      <BudgetEstimatorContent />
    </Suspense>
  );
}
