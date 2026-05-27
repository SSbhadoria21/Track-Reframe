'use client';

import { useBudgetStore } from '@/store/budgetStore';
import { ChevronLeft, Download, FileSpreadsheet, Share2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'react-hot-toast';

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const COLORS = ['#F5A623', '#F7B74A', '#F9C972', '#FAD999', '#FCF0C1', '#D48B1A', '#B37515', '#915F10'];

export default function BudgetSummary() {
  const { projectData, departments, grandTotal, setStep } = useBudgetStore();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const activeDepartments = departments.filter(d => d.subtotal > 0);
  
  const chartData = activeDepartments.map((dep, index) => ({
    name: dep.name.replace(/^\d+\.\s*/, ''), // Remove numbers
    value: dep.subtotal,
    color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value); // Sort for bar chart

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    
    setIsExporting(true);
    const loadingToast = toast.loading("Generating PDF...");
    
    try {
      const element = pdfRef.current;
      
      // Temporarily change styling to light mode for printing
      element.setAttribute('data-print', 'true');
      
      const imgData = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      element.removeAttribute('data-print');
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${projectData.title.replace(/\s+/g, '_')}_Budget_v1.pdf`);
      
      toast.success("PDF exported successfully!", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Department,Item Name,Role/Description,Payment Type,Rate,Units,Subtotal,Notes\n";
    
    departments.forEach(dep => {
      dep.items.forEach(item => {
        const row = [
          `"${dep.name}"`,
          `"${item.name}"`,
          `"${item.roleDescription}"`,
          `"${item.paymentType}"`,
          item.rate,
          item.units,
          item.subtotal,
          `"${item.notes}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${projectData.title.replace(/\s+/g, '_')}_Budget.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exported!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setStep(2)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Editor
        </button>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-[#1A1A25] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download CSV
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-[#1A1A25] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share Link
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-6 py-2 rounded-lg bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold transition-all shadow-[0_0_15px_rgba(245,166,35,0.2)] text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> {isExporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">Budget Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatMoney(value as number, projectData.currency)}
                    contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300 truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-white pl-2">
                    {formatMoney(item.value, projectData.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Printable Area (Hidden normally, styled for PDF via data-print) */}
        <div className="lg:col-span-2">
          
          <div 
            ref={pdfRef}
            className="bg-[#111118] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 print:bg-[#ffffff] print:text-[#000000] data-[print=true]:bg-[#ffffff] data-[print=true]:text-[#000000]"
          >
            {/* Header */}
            <div className="border-b border-[rgba(255,255,255,0.1)] data-[print=true]:border-[#e5e7eb] pb-6 mb-6">
              <h1 className="text-4xl font-bold text-[#ffffff] data-[print=true]:text-[#000000] mb-2">{projectData.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-[#9ca3af] data-[print=true]:text-[#4b5563]">
                <span>{projectData.type}</span> •
                <span>{projectData.scope}</span> •
                <span>{projectData.shootDays} Shoot Days</span> •
                <span>Currency: {projectData.currency}</span>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#1A1A25] data-[print=true]:bg-[#f9fafb] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] data-[print=true]:border-[#e5e7eb]">
                <div className="text-sm text-[#9ca3af] data-[print=true]:text-[#6b7280] mb-1">Subtotal</div>
                <div className="text-xl font-mono text-[#ffffff] data-[print=true]:text-[#000000] font-bold">
                  {formatMoney(grandTotal, projectData.currency)}
                </div>
              </div>
              <div className="bg-[#1A1A25] data-[print=true]:bg-[#f9fafb] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] data-[print=true]:border-[#e5e7eb]">
                <div className="text-sm text-[#9ca3af] data-[print=true]:text-[#6b7280] mb-1">
                  Contingency ({projectData.contingencyPercent}%)
                </div>
                <div className="text-xl font-mono text-[#ffffff] data-[print=true]:text-[#000000] font-bold">
                  {formatMoney(grandTotal * (projectData.contingencyPercent / 100), projectData.currency)}
                </div>
              </div>
              <div className="col-span-2 bg-[#F5A623]/10 data-[print=true]:bg-[#F5A623]/20 p-6 rounded-xl border border-[#F5A623]/30">
                <div className="text-sm text-[#F5A623] data-[print=true]:text-[#D48B1A] font-bold tracking-widest uppercase mb-1">
                  Grand Total
                </div>
                <div className="text-4xl font-mono text-[#F5A623] data-[print=true]:text-[#000000] font-black">
                  {formatMoney(grandTotal * (1 + projectData.contingencyPercent / 100), projectData.currency)}
                </div>
              </div>
            </div>

            {/* Department Breakdowns */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b border-[rgba(255,255,255,0.1)] data-[print=true]:border-[#e5e7eb] pb-2">
                Detailed Breakdown
              </h2>
              {activeDepartments.map(dep => (
                <div key={dep.id} className="space-y-2">
                  <div className="flex justify-between items-end bg-[#1A1A25] data-[print=true]:bg-[#f3f4f6] p-2 rounded px-3">
                    <h4 className="font-bold text-sm text-[#d1d5db] data-[print=true]:text-[#000000]">{dep.name}</h4>
                    <span className="font-mono text-sm font-bold text-[#ffffff] data-[print=true]:text-[#000000]">
                      {formatMoney(dep.subtotal, projectData.currency)}
                    </span>
                  </div>
                  <div className="px-3">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {dep.items.map((item, i) => (
                          <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] data-[print=true]:border-[#f3f4f6] last:border-0">
                            <td className="py-2 text-[#d1d5db] data-[print=true]:text-[#1f2937] w-1/3">{item.name}</td>
                            <td className="py-2 text-[#6b7280] data-[print=true]:text-[#4b5563] text-xs w-1/4">
                              {item.units > 0 && `${item.units} x `}
                              {formatMoney(item.rate, projectData.currency)}
                            </td>
                            <td className="py-2 text-right font-mono text-[#d1d5db] data-[print=true]:text-[#111827] font-medium">
                              {formatMoney(item.subtotal, projectData.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes Section */}
            {projectData.notes && (
              <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.1)] data-[print=true]:border-[#e5e7eb]">
                <h3 className="font-bold text-lg mb-2 text-[#ffffff] data-[print=true]:text-[#000000]">Production Notes</h3>
                <p className="text-sm text-[#9ca3af] data-[print=true]:text-[#4b5563] whitespace-pre-wrap">
                  {projectData.notes}
                </p>
              </div>
            )}
            
            <div className="mt-12 text-center text-xs text-[#6b7280]">
              Generated by Track Reframe • Film Budget Estimator
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
