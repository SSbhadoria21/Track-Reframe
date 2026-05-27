'use client';

import { useBudgetStore } from '@/store/budgetStore';
import { FileText, Sparkles, X, Users, MapPin, CalendarDays, Clapperboard } from 'lucide-react';
import { useState } from 'react';

export default function ScriptContextPanel() {
  const { projectData } = useBudgetStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!projectData.scriptUrl) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/3 bg-[#111118] border border-[#F5A623]/30 border-r-0 rounded-l-lg p-2 shadow-xl hover:bg-[#1A1A25] transition-colors group z-40"
      >
        <div className="flex flex-col items-center gap-2 w-8">
          <Sparkles className="w-5 h-5 text-[#F5A623] group-hover:animate-pulse" />
          <span className="text-[10px] font-bold text-gray-300 writing-vertical-lr rotate-180 tracking-widest mt-2">
            AI CONTEXT
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[280px] bg-[#0A0A0F]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111118]">
        <div className="flex items-center gap-2 text-[#F5A623]">
          <Sparkles className="w-4 h-4" />
          <h3 className="font-bold text-sm tracking-wide">AI SCRIPT CONTEXT</h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        
        <div className="flex flex-col gap-2 items-center text-center pb-4 border-b border-white/5">
          <div className="p-3 bg-[#F5A623]/10 rounded-full">
            <FileText className="w-6 h-6 text-[#F5A623]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{projectData.scriptUrl}</p>
            <p className="text-xs text-green-400">Successfully Analyzed</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111118] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-xl font-bold text-white">{projectData.shootDays}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Shoot Days</span>
          </div>
          
          <div className="bg-[#111118] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xl font-bold text-white">~12</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Cast</span>
          </div>
          
          <div className="bg-[#111118] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-xl font-bold text-white">5</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Locations</span>
          </div>
          
          <div className="bg-[#111118] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
            <Clapperboard className="w-4 h-4 text-gray-400" />
            <span className="text-xl font-bold text-white">34</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Scenes</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Suggestions Applied</h4>
          <p className="text-xs text-gray-300 leading-relaxed bg-[#111118] p-3 rounded-lg border border-white/5">
            The AI has populated your budget line items based on standard rates for an <strong className="text-white">{projectData.scale}</strong> scale production.
            You can modify or override any values in the main table.
          </p>
        </div>

      </div>
    </div>
  );
}
