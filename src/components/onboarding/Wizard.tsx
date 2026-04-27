"use client";

import { useState } from "react";
import { CameraIcon } from "@/components/icons";

export function Wizard() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const genres = [
    "Action", "Drama", "Horror", "Comedy", 
    "Thriller", "Documentary", "Sci-Fi", "Romance"
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* FILM STRIP PROGRESS BAR */}
      <div className="h-16 flex items-center px-8 border-b border-white/10 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-8 film-strip-border border-y-0 rounded-sm overflow-hidden flex">
            <div className={`h-full w-full transition-colors ${
              step > i ? "bg-amber" : step === i ? "bg-amber/20 glow-amber" : "bg-[#0D0D12]"
            }`} />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-display font-bold mb-2">What kind of films move you?</h2>
            <p className="text-text-secondary text-sm mb-8">Select all genres that resonate with your style. This helps personalize your feed.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {genres.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`h-[110px] rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                      isSelected 
                        ? "border-2 border-amber bg-amber/10 text-amber glow-amber" 
                        : "border border-white/10 bg-[#0D0D12] text-text-primary hover:border-amber/50 hover:scale-[1.03]"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-display font-bold mb-2">Which directors inspire your visual style?</h2>
            <p className="text-text-secondary text-sm mb-6">Select up to 10. This powers your AI script continuity.</p>
            
            <input 
              type="text" 
              placeholder="Search directors..." 
              className="w-full h-12 bg-[#0D0D12] border border-white/10 rounded-md px-4 mb-6 text-white focus:outline-none focus:border-indigo transition-colors"
            />
            
            <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
              {/* Dummy directors */}
              {["Christopher Nolan", "S.S. Rajamouli", "Zoya Akhtar", "Denis Villeneuve", "Sanjay Leela Bhansali", "Wong Kar-wai"].map(director => (
                <div key={director} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-[#0D0D12] cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-surface shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{director}</span>
                    <span className="text-[10px] text-text-muted">Signature style tag</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-display font-bold mb-6">Set up your creator profile</h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-amber flex flex-col items-center justify-center cursor-pointer hover:bg-amber/5 transition-colors group relative overflow-hidden">
                <CameraIcon className="w-8 h-8 text-amber mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-text-secondary">Upload</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Bio</label>
                <textarea 
                  className="w-full h-20 bg-[#0D0D12] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-amber text-sm resize-none"
                  placeholder="Tell other filmmakers what you're working on..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">City</label>
                  <input type="text" className="w-full h-10 bg-[#0D0D12] border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-amber text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Portfolio Link</label>
                  <input type="url" className="w-full h-10 bg-[#0D0D12] border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-amber text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#0D0D12]/50">
        <button 
          onClick={() => setStep(Math.max(1, step - 1))}
          className={`text-sm font-medium ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-text-secondary hover:text-white'}`}
        >
          Back
        </button>
        
        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && selectedGenres.length === 0}
            className="h-10 px-6 rounded-md bg-amber text-[#0A0A0F] font-bold text-sm hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
          >
            Continue →
          </button>
        ) : (
          <button 
            className="h-10 px-8 rounded-md bg-amber text-[#0A0A0F] font-bold text-sm flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-transform glow-amber"
          >
            Let's Create →
          </button>
        )}
      </div>
    </div>
  );
}
