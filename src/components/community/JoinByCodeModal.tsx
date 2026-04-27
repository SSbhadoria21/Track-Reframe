"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkIcon, XIcon, RefreshCwIcon, CheckIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinByCodeModal({ isOpen, onClose }: JoinByCodeModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (!code) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/community/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.push(`/community/${data.communityId}`);
        }, 1500);
      } else {
        setError(data.error || "Invalid invite code.");
      }
    } catch (err) {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-[#1A1A25] border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Join Production Crew</h2>
              <button onClick={onClose} className="text-text-muted hover:text-white transition-all">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 rounded-full bg-success/20 border border-success/40 flex items-center justify-center mb-6">
                  <CheckIcon className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-2">Access Granted</h3>
                <p className="text-sm text-text-muted">Redirecting you to the set...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-text-muted leading-relaxed">
                  Enter the unique invite code to join a private room. Codes typically start with <b>TR-</b>.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="TR-XXXXXX"
                      className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-center font-mono text-lg tracking-[0.2em] text-amber focus:outline-none focus:border-amber transition-all"
                    />
                  </div>

                  {error && (
                    <div className="text-[11px] font-bold text-error bg-error/10 py-2 rounded-lg border border-error/20 text-center">
                      {error}
                    </div>
                  )}

                  <button 
                    onClick={handleJoin}
                    disabled={loading || !code}
                    className="w-full h-14 bg-amber text-black font-display font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCwIcon className="w-5 h-5 animate-spin" />
                        Entering...
                      </>
                    ) : (
                      "Join Crew"
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
