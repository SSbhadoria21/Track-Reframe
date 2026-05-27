'use client';

import { useState } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { UploadCloud, FileText, ChevronRight, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProjectSetup() {
  const { projectData, updateProjectData, setStep, applyAiSuggestions } = useBudgetStore();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(pdf|txt|fdx)$/i)) {
      toast.error("Please upload a .pdf, .txt, or .fdx file");
      return;
    }
    
    setIsUploading(true);
    toast.loading("Analyzing script with AI...", { id: 'script-upload' });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scale', projectData.scale);
      
      const res = await fetch('/api/ai/budget-estimator', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to analyze script');
      
      applyAiSuggestions(data.suggestions);
      
      // Update basic details if AI gave us insight
      updateProjectData({
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        scriptUrl: file.name // Just storing the name for display now
      });
      
      toast.success("Script analyzed successfully!", { id: 'script-upload' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze script", { id: 'script-upload' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-[#F5A623]/10 rounded-full mb-4">
          <Calculator className="w-8 h-8 text-[#F5A623]" />
        </div>
        <h2 className="text-3xl font-bold">Project Setup</h2>
        <p className="text-gray-400">Let's start by defining the scale and scope of your production.</p>
      </div>

      <div className="bg-[#111118] p-8 rounded-2xl border border-white/5 space-y-8 shadow-2xl">
        
        {/* Project Title */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Project Title</label>
          <input 
            type="text" 
            value={projectData.title}
            onChange={(e) => updateProjectData({ title: e.target.value })}
            placeholder="e.g. The Grand Escape"
            className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623] transition-colors"
          />
        </div>

        {/* Project Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Project Type</label>
          <div className="flex flex-wrap gap-2">
            {['Short Film', 'Feature Film', 'Web Series', 'Music Video', 'Documentary', 'Advertisement'].map((type) => (
              <button
                key={type}
                onClick={() => updateProjectData({ type })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  projectData.type === type 
                    ? 'bg-[#F5A623] text-black shadow-[0_0_15px_rgba(245,166,35,0.3)]' 
                    : 'bg-[#1A1A25] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Script Upload */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Script Upload (Optional)</label>
          <p className="text-xs text-gray-500 mb-2">Upload your script to let our AI auto-generate budget suggestions for Cast, Locations, and Departments.</p>
          
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive ? 'border-[#F5A623] bg-[#F5A623]/5' : 'border-white/10 hover:border-white/20 bg-[#0A0A0F]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".pdf,.txt,.fdx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            {projectData.scriptUrl ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-[#F5A623]" />
                <p className="text-white font-medium">{projectData.scriptUrl}</p>
                <p className="text-sm text-green-400">Analyzed successfully!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <UploadCloud className={`w-10 h-10 ${isUploading ? 'text-[#F5A623] animate-bounce' : 'text-gray-500'}`} />
                <p className="text-white font-medium">{isUploading ? 'Analyzing...' : 'Drag & drop script here'}</p>
                <p className="text-sm text-gray-500">Supports .pdf, .txt, .fdx</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Scope */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Budget Scope</label>
            <select 
              value={projectData.scope}
              onChange={(e) => updateProjectData({ scope: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623]"
            >
              <option>Full Production (Complete Film)</option>
              <option>Single Day (Daily Budget)</option>
              <option>Pre-Production Only</option>
              <option>Post-Production Only</option>
            </select>
          </div>

          {/* Production Scale */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Production Scale</label>
            <select 
              value={projectData.scale}
              onChange={(e) => updateProjectData({ scale: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623]"
            >
              <option value="Micro">Micro (1–5 people, phone/DSLR)</option>
              <option value="Indie">Indie (5–20 people, prosumer gear)</option>
              <option value="Semi-Professional">Semi-Professional (20–50 people, cinema camera)</option>
              <option value="Professional">Professional (50+ people, full crew)</option>
            </select>
          </div>

          {/* Shoot Duration */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Estimated Shoot Days</label>
            <input 
              type="number" 
              min="1"
              value={projectData.shootDays}
              onChange={(e) => updateProjectData({ shootDays: parseInt(e.target.value) || 1 })}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623]"
            />
          </div>

          {/* Currency */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Currency</label>
            <select 
              value={projectData.currency}
              onChange={(e) => updateProjectData({ currency: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F5A623]"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            if (!projectData.title) {
              toast.error("Please enter a Project Title");
              return;
            }
            setStep(2);
          }}
          className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,166,35,0.2)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)]"
        >
          Start Budget
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
