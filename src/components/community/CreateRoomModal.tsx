"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon, CopyIcon, RefreshCwIcon, XIcon, CheckIcon } from "@/components/icons";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TAG_OPTIONS = [
  "Action", "Drama", "Cinematography", "Screenwriting", "Bollywood", 
  "Arthouse", "Short Film", "Documentary", "VFX", "Animation", 
  "Sound Design", "Music Score", "International Cinema", "Hindi Film", 
  "Tamil Film", "World Cinema"
];

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover_url: "",
    is_private: false,
    require_approval: false,
    tags: [] as string[]
  });

  // Generate invite code on mount or refresh
  useEffect(() => {
    if (isOpen) {
      generateInviteCode();
    }
  }, [isOpen]);

  const generateInviteCode = () => {
    const code = "TR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError("Please enter a room name.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/community/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          inviteCode
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || "Failed to create room. Please try again.");
      }
    } catch (err) {
      console.error("Failed to create room:", err);
      setError("A connection error occurred. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-[#1A1A25] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Create Production Room</h2>
                <p className="text-sm text-text-muted mt-1">Set the stage for your crew's collaboration.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              {error && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side - Info */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber mb-2 block">Room Identity</label>
                    <input 
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.slice(0, 40) }))}
                      placeholder="e.g. 'Project: Neon Noir' Chat" 
                      className="w-full h-12 bg-black/40 border border-white/10 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-amber focus:bg-black/60 transition-all"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-text-muted">{formData.name.length}/40</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber mb-2 block">Mission Statement</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value.slice(0, 160) }))}
                      placeholder="Briefly describe what this crew is building..." 
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-amber focus:bg-black/60 transition-all resize-none"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-text-muted">{formData.description.length}/160</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber mb-2 block">Privacy & Access</label>
                    
                    <div className="flex p-1 bg-black/40 border border-white/10 rounded-2xl">
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, is_private: false }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!formData.is_private ? "bg-amber text-black" : "text-text-muted hover:text-white"}`}
                      >
                        Public
                      </button>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, is_private: true }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${formData.is_private ? "bg-indigo text-white" : "text-text-muted hover:text-white"}`}
                      >
                        Private
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Require Join Approval</span>
                        <span className="text-[11px] text-text-muted">Only allow approved crew members</span>
                      </div>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, require_approval: !prev.require_approval }))}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.require_approval ? "bg-success" : "bg-white/10"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.require_approval ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side - Customization */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber mb-2 block">Visual Cover</label>
                    <div className="space-y-3">
                      <div className="aspect-video w-full bg-black/40 border-2 border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-3 group transition-all overflow-hidden relative">
                        {formData.cover_url ? (
                          <img src={formData.cover_url} alt="Cover Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <CameraIcon className="w-8 h-8 text-text-muted group-hover:text-amber transition-all" />
                            <span className="text-xs text-text-muted px-4 text-center">Paste image URL below</span>
                          </>
                        )}
                      </div>
                      <input 
                        value={formData.cover_url}
                        onChange={e => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                        placeholder="https://image-url.com/cover.jpg"
                        className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-amber transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber mb-2 block">Production Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_OPTIONS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                            formData.tags.includes(tag)
                              ? "bg-amber/20 border-amber text-amber"
                              : "bg-white/5 border-white/10 text-text-muted hover:border-white/30"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Invite Code</span>
                <div className="flex items-center gap-2 font-mono text-amber bg-amber/10 px-3 py-1.5 rounded-lg border border-amber/20">
                  <span className="text-sm font-bold">{inviteCode}</span>
                  <button 
                    onClick={generateInviteCode}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <RefreshCwIcon className="w-3.5 h-3.5 text-amber/60 hover:text-amber transition-all" />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={loading || !formData.name}
                className="px-10 h-14 bg-amber text-black font-display font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber/20 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? "Establishing..." : "Launch Room"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
