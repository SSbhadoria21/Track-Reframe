"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LinkIcon, CheckIcon, XIcon, RefreshCwIcon } from "@/components/icons";

interface JoinRoomOverlayProps {
  roomInfo: any;
  onSuccess: () => void;
}

export function JoinRoomOverlay({ roomInfo, onSuccess }: JoinRoomOverlayProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          onSuccess();
        }, 1500);
      } else {
        setError(data.error || "Invalid invite code. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#1A1A25] border border-white/10 rounded-[32px] p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo/10 blur-[100px] rounded-full" />

        {success ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-success/20 border border-success/40 flex items-center justify-center mb-6">
              <CheckIcon className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-2">Welcome Aboard</h2>
            <p className="text-sm text-text-muted">You are now a member of the crew.</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-[28px] bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 relative">
               <LinkIcon className="w-10 h-10 text-amber" />
            </div>

            <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-3">Restricted Access</h2>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              This room requires an <b>Invite Code</b> to join the conversation. Please enter the code provided by the crew lead.
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
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-bold text-error bg-error/10 py-2 rounded-lg border border-error/20"
                >
                  {error}
                </motion.div>
              )}

              <button 
                onClick={handleJoin}
                disabled={loading || !code}
                className="w-full h-14 bg-amber text-black font-display font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCwIcon className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Join Production"
                )}
              </button>
            </div>

            <button className="mt-6 text-[10px] font-bold text-text-muted hover:text-white uppercase tracking-widest transition-all">
              Request Access
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
