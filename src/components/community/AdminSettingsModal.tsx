"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, RefreshCwIcon, SettingsIcon } from "@/components/icons";

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomInfo: any;
  onUpdate: (updated: any) => void;
}

export function AdminSettingsModal({ isOpen, onClose, roomInfo, onUpdate }: AdminSettingsModalProps) {
  const [name, setName] = useState(roomInfo?.name || "");
  const [description, setDescription] = useState(roomInfo?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/community/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roomId: roomInfo.id,
          name,
          description
        })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.community);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Update failed.");
      }
    } catch (err) {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this community? This action is permanent and will remove all messages and members.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/community/delete?id=${roomInfo.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        window.location.href = "/community";
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      alert("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#1A1A25] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden relative"
          >
             <div className="absolute top-0 right-0 p-6">
                <button onClick={onClose} className="text-text-muted hover:text-white transition-all">
                  <XIcon className="w-6 h-6" />
                </button>
             </div>

             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center">
                   <SettingsIcon className="w-6 h-6 text-amber" />
                </div>
                <div>
                   <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Production Settings</h2>
                   <p className="text-xs text-text-muted">Manage your community and set parameters.</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Production Name</label>
                   <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-amber transition-all"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Logline / Description</label>
                   <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-amber transition-all resize-none"
                   />
                </div>

                {error && (
                   <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-[11px] font-bold text-center">
                      {error}
                   </div>
                )}

                <div className="flex gap-4 pt-4">
                   <button 
                      onClick={handleUpdate}
                      disabled={loading || !name.trim()}
                      className="flex-1 h-14 bg-amber text-black font-display font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber/20 disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {loading ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : "Save Changes"}
                   </button>
                   <button 
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-6 h-14 bg-error/10 border border-error/20 text-error font-display font-black uppercase tracking-widest rounded-2xl hover:bg-error hover:text-white transition-all disabled:opacity-50"
                   >
                      Delete
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
