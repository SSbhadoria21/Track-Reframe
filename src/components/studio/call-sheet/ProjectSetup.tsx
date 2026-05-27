'use client';

import { useState } from 'react';
import { useCallSheetStore } from '@/store/callSheetStore';
import { UploadCloud, FileText, ChevronRight, Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProjectSetup() {
  const { projectInfo, updateProjectInfo, locations, addLocation, updateLocation, removeLocation, setStep, applyAiSuggestions } = useCallSheetStore();
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
    toast.loading("Analyzing script with AI...", { id: 'cs-upload' });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/ai/call-sheet-parser', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to analyze script');
      
      applyAiSuggestions(data);
      
      updateProjectInfo({
        projectTitle: file.name.replace(/\.[^/.]+$/, ""),
        scriptUrl: file.name
      });
      
      toast.success("Script analyzed successfully! Scenes & Actors populated.", { id: 'cs-upload' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze script", { id: 'cs-upload' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleNewLocation = () => {
    addLocation({
      id: crypto.randomUUID(),
      locationName: '',
      address: '',
      locationType: 'Both',
      mapsLink: '',
      landmark: '',
      parkingNotes: ''
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-[#F5A623]/10 rounded-full mb-4">
          <Settings className="w-8 h-8 text-[#F5A623]" />
        </div>
        <h2 className="text-3xl font-bold">Project & Day Setup</h2>
        <p className="text-gray-400">Enter production details and upload your script for AI processing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Production Details */}
        <div className="bg-[#111118] p-6 rounded-2xl border border-white/5 space-y-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Production Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Project Title</label>
              <input 
                type="text" 
                value={projectInfo.projectTitle}
                onChange={(e) => updateProjectInfo({ projectTitle: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Project Type</label>
                <select 
                  value={projectInfo.projectType}
                  onChange={(e) => updateProjectInfo({ projectType: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                >
                  <option>Short Film</option>
                  <option>Feature Film</option>
                  <option>Web Series</option>
                  <option>Music Video</option>
                  <option>Documentary</option>
                  <option>Ad Film</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Production Co.</label>
                <input 
                  type="text" 
                  value={projectInfo.productionCompany}
                  onChange={(e) => updateProjectInfo({ productionCompany: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Director</label>
                <input 
                  type="text" 
                  value={projectInfo.directorName}
                  onChange={(e) => updateProjectInfo({ directorName: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Producer</label>
                <input 
                  type="text" 
                  value={projectInfo.producerName}
                  onChange={(e) => updateProjectInfo({ producerName: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shoot Day Info */}
        <div className="bg-[#111118] p-6 rounded-2xl border border-white/5 space-y-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Shoot Day Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Shooting Date</label>
                <input 
                  type="date" 
                  value={projectInfo.shootDate}
                  onChange={(e) => updateProjectInfo({ shootDate: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Day No.</label>
                  <input 
                    type="number" min="1"
                    value={projectInfo.shootDayNumber}
                    onChange={(e) => updateProjectInfo({ shootDayNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
                <span className="text-gray-500 pb-3">of</span>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Total</label>
                  <input 
                    type="number" min="1"
                    value={projectInfo.totalShootDays}
                    onChange={(e) => updateProjectInfo({ totalShootDays: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Reporting Time</label>
                <input 
                  type="time" 
                  value={projectInfo.generalCallTime}
                  onChange={(e) => updateProjectInfo({ generalCallTime: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Shoot Start</label>
                <input 
                  type="time" 
                  value={projectInfo.shootStartTime}
                  onChange={(e) => updateProjectInfo({ shootStartTime: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">Est. Wrap</label>
                <input 
                  type="time" 
                  value={projectInfo.estimatedWrapTime}
                  onChange={(e) => updateProjectInfo({ estimatedWrapTime: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Script & Locations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Script Upload */}
        <div className="bg-[#111118] p-6 rounded-2xl border border-white/5 space-y-4 shadow-2xl">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">AI Auto-Fill (Optional)</h3>
          <p className="text-sm text-gray-400">Upload your script to let our AI auto-extract scenes and characters for today.</p>
          
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
              title=""
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            {projectInfo.scriptUrl ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-[#F5A623]" />
                <p className="text-white font-medium">{projectInfo.scriptUrl}</p>
                <p className="text-sm text-green-400">Data Extracted Successfully</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <UploadCloud className={`w-10 h-10 ${isUploading ? 'text-[#F5A623] animate-bounce' : 'text-gray-500'}`} />
                <p className="text-white font-medium">{isUploading ? 'Analyzing Script...' : 'Drag & drop script here'}</p>
                <p className="text-sm text-gray-500">Supports .pdf, .txt, .fdx</p>
              </div>
            )}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-[#111118] p-6 rounded-2xl border border-white/5 space-y-4 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-lg font-bold text-white">Shooting Locations</h3>
            <button onClick={handleNewLocation} className="text-sm text-amber flex items-center gap-1 hover:text-amber/80">
              <Plus className="w-4 h-4" /> Add Location
            </button>
          </div>
          
          <div className="space-y-4 overflow-y-auto flex-1 max-h-[300px] pr-2">
            {locations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No locations added yet.</p>
            ) : (
              locations.map((loc, idx) => (
                <div key={loc.id} className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 relative group">
                  <button 
                    onClick={() => removeLocation(loc.id)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Location Name (e.g. Cafe Delight)"
                      value={loc.locationName}
                      onChange={(e) => updateLocation(loc.id, { locationName: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-white focus:outline-none focus:border-[#F5A623] font-medium"
                    />
                    <textarea 
                      placeholder="Full Address"
                      value={loc.address}
                      onChange={(e) => updateLocation(loc.id, { address: e.target.value })}
                      className="w-full bg-[#111118] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#F5A623] resize-none h-16"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="url" 
                        placeholder="Google Maps Link"
                        value={loc.mapsLink}
                        onChange={(e) => updateLocation(loc.id, { mapsLink: e.target.value })}
                        className="w-full bg-[#111118] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#F5A623]"
                      />
                      <input 
                        type="text" 
                        placeholder="Parking Notes"
                        value={loc.parkingNotes}
                        onChange={(e) => updateLocation(loc.id, { parkingNotes: e.target.value })}
                        className="w-full bg-[#111118] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#F5A623]"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            if (!projectInfo.projectTitle) {
              toast.error("Please enter a Project Title");
              return;
            }
            if (locations.length === 0) {
              toast.error("Please add at least one location");
              return;
            }
            setStep(2);
          }}
          className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,166,35,0.2)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)]"
        >
          Next: Fill Sections
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
