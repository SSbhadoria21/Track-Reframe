export type PaymentType = 'One-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Hourly' | 'Per Project' | 'Deferred' | 'In-Kind';

export interface LineItem {
  id: string;
  name: string;
  roleDescription: string;
  paymentType: PaymentType;
  rate: number;
  units: number;
  subtotal: number;
  notes: string;
}

export interface Department {
  id: string;
  name: string;
  order: number;
  isExpanded: boolean;
  subtotal: number;
  items: LineItem[];
}

const generateId = () => crypto.randomUUID();

export const BUDGET_DEPARTMENTS_TEMPLATE: Omit<Department, 'id' | 'items' | 'subtotal'>[] = [
  { name: '1. ABOVE THE LINE', order: 1, isExpanded: true },
  { name: '2. CAST', order: 2, isExpanded: false },
  { name: '3. DIRECTION DEPARTMENT', order: 3, isExpanded: false },
  { name: '4. CINEMATOGRAPHY DEPARTMENT', order: 4, isExpanded: false },
  { name: '5. CAMERA & LENS EQUIPMENT', order: 5, isExpanded: false },
  { name: '6. LIGHTING DEPARTMENT', order: 6, isExpanded: false },
  { name: '7. ART DEPARTMENT', order: 7, isExpanded: false },
  { name: '8. COSTUME & MAKEUP', order: 8, isExpanded: false },
  { name: '9. SOUND DEPARTMENT', order: 9, isExpanded: false },
  { name: '10. LOCATIONS', order: 10, isExpanded: false },
  { name: '11. TRANSPORT & LOGISTICS', order: 11, isExpanded: false },
  { name: '12. CATERING & HOSPITALITY', order: 12, isExpanded: false },
  { name: '13. POST PRODUCTION', order: 13, isExpanded: false },
  { name: '14. MUSIC & SOUND', order: 14, isExpanded: false },
  { name: '15. VISUAL EFFECTS (VFX)', order: 15, isExpanded: false },
  { name: '16. MARKETING & DISTRIBUTION', order: 16, isExpanded: false },
  { name: '17. INSURANCE & LEGAL', order: 17, isExpanded: false },
  { name: '18. MISCELLANEOUS', order: 18, isExpanded: false },
];

export const getDefaultDepartments = (): Department[] => {
  return BUDGET_DEPARTMENTS_TEMPLATE.map(dep => ({
    id: generateId(),
    ...dep,
    subtotal: 0,
    items: [],
  }));
};

export const getSuggestedRate = (scale: string, role: string): number => {
  // A basic heuristic for suggested rates based on scale
  if (scale === 'Micro') return 100;
  if (scale === 'Indie') return 250;
  if (scale === 'Semi-Professional') return 500;
  if (scale === 'Professional') return 1000;
  return 0;
};
