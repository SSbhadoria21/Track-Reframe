import { create } from 'zustand';
import { Department, LineItem, getDefaultDepartments } from '@/lib/budget-defaults';

export interface BudgetProjectData {
  id?: string;
  title: string;
  type: string;
  scope: string;
  shootDays: number;
  startDate: string;
  currency: string;
  scale: string;
  contingencyPercent: number;
  notes: string;
  scriptUrl?: string;
  scriptPageCount?: number;
}

interface BudgetState {
  currentStep: number;
  projectData: BudgetProjectData;
  departments: Department[];
  crewCount: number;
  grandTotal: number;
  isSaving: boolean;
  lastSavedAt: string | null;
  
  // Actions
  setStep: (step: number) => void;
  updateProjectData: (data: Partial<BudgetProjectData>) => void;
  setDepartments: (departments: Department[]) => void;
  addDepartmentItem: (departmentId: string, item: Omit<LineItem, 'id' | 'subtotal'>) => void;
  updateDepartmentItem: (departmentId: string, itemId: string, updates: Partial<LineItem>) => void;
  removeDepartmentItem: (departmentId: string, itemId: string) => void;
  toggleDepartmentExpanded: (departmentId: string) => void;
  calculateTotals: () => void;
  applyAiSuggestions: (suggestions: Record<string, Partial<LineItem>[]>) => void;
}

const initialProjectData: BudgetProjectData = {
  title: '',
  type: 'Short Film',
  scope: 'Full Production',
  shootDays: 1,
  startDate: new Date().toISOString().split('T')[0],
  currency: 'USD',
  scale: 'Indie',
  contingencyPercent: 10,
  notes: '',
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  currentStep: 1,
  projectData: initialProjectData,
  departments: getDefaultDepartments(),
  crewCount: 0,
  grandTotal: 0,
  isSaving: false,
  lastSavedAt: null,

  setStep: (step) => set({ currentStep: step }),
  
  updateProjectData: (data) => set((state) => ({
    projectData: { ...state.projectData, ...data }
  })),

  setDepartments: (departments) => {
    set({ departments });
    get().calculateTotals();
  },

  addDepartmentItem: (departmentId, itemData) => {
    set((state) => {
      const newItems = state.departments.map(dep => {
        if (dep.id === departmentId) {
          const newItem = {
            ...itemData,
            id: crypto.randomUUID(),
            subtotal: itemData.rate * itemData.units
          };
          return { ...dep, items: [...dep.items, newItem] };
        }
        return dep;
      });
      return { departments: newItems };
    });
    get().calculateTotals();
  },

  updateDepartmentItem: (departmentId, itemId, updates) => {
    set((state) => {
      const newItems = state.departments.map(dep => {
        if (dep.id === departmentId) {
          const updatedItems = dep.items.map(item => {
            if (item.id === itemId) {
              const updatedItem = { ...item, ...updates };
              updatedItem.subtotal = updatedItem.rate * updatedItem.units;
              return updatedItem;
            }
            return item;
          });
          return { ...dep, items: updatedItems };
        }
        return dep;
      });
      return { departments: newItems };
    });
    get().calculateTotals();
  },

  removeDepartmentItem: (departmentId, itemId) => {
    set((state) => {
      const newItems = state.departments.map(dep => {
        if (dep.id === departmentId) {
          return { ...dep, items: dep.items.filter(item => item.id !== itemId) };
        }
        return dep;
      });
      return { departments: newItems };
    });
    get().calculateTotals();
  },

  toggleDepartmentExpanded: (departmentId) => {
    set((state) => ({
      departments: state.departments.map(dep => 
        dep.id === departmentId ? { ...dep, isExpanded: !dep.isExpanded } : dep
      )
    }));
  },

  calculateTotals: () => {
    set((state) => {
      let grandTotal = 0;
      let crewCount = 0;
      
      const newDeps = state.departments.map(dep => {
        const subtotal = dep.items.reduce((sum, item) => sum + item.subtotal, 0);
        grandTotal += subtotal;
        
        // Very basic crew counting heuristic (could be improved)
        crewCount += dep.items.filter(i => 
          i.roleDescription && !i.name.toLowerCase().includes('equipment') && !i.name.toLowerCase().includes('rental')
        ).length;
        
        return { ...dep, subtotal };
      });

      // Add contingency
      const contingencyAmt = grandTotal * (state.projectData.contingencyPercent / 100);
      const finalTotal = grandTotal + contingencyAmt;

      return {
        departments: newDeps,
        grandTotal: finalTotal,
        crewCount,
      };
    });
  },

  applyAiSuggestions: (suggestions) => {
    // Basic implementation: replace items in departments with suggestions
    set((state) => {
      const newDeps = state.departments.map(dep => {
        const depKey = dep.name.replace(/^\d+\.\s*/, '').toLowerCase(); // e.g., "1. ABOVE THE LINE" -> "above the line"
        
        // Find matching suggestion key
        const matchKey = Object.keys(suggestions).find(k => k.toLowerCase() === depKey);
        
        if (matchKey && suggestions[matchKey]) {
           const newItems = suggestions[matchKey].map(sug => ({
             id: crypto.randomUUID(),
             name: sug.name || '',
             roleDescription: sug.roleDescription || '',
             paymentType: sug.paymentType || 'Daily',
             rate: sug.rate || 0,
             units: sug.units || 1,
             subtotal: (sug.rate || 0) * (sug.units || 1),
             notes: sug.notes || 'AI Suggested'
           })) as LineItem[];
           
           return { ...dep, items: newItems, isExpanded: true };
        }
        return dep;
      });
      
      return { departments: newDeps };
    });
    get().calculateTotals();
  }
}));
