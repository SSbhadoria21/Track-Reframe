"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadIcon, CheckIcon, TrophyIcon, ShieldCheckIcon } from "@/components/icons";
import { toast } from "react-hot-toast";

interface CertificateCardProps {
  certificate: any;
  onClaimed?: () => void;
}

export function CertificateCard({ certificate, onClaimed }: CertificateCardProps) {
  const [claiming, setClaiming] = useState(false);
  const isClaimed = certificate.competition.metadata?.reward_claimed;

  const handleDownload = () => {
    // In a real app, this would trigger a PDF generation
    window.print();
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
        const res = await fetch("/api/competitions/claim", {
            method: "POST",
            body: JSON.stringify({ competition_id: certificate.competition_id })
        });
        if (res.ok) {
            toast.success("Rewards claimed successfully!");
            if (onClaimed) onClaimed();
        } else {
            const data = await res.json();
            toast.error(data.error);
        }
    } catch (err) {
        toast.error("Failed to claim rewards");
    } finally {
        setClaiming(false);
    }
  };

  return (
    <motion.div 
        whileHover={{ y: -5 }}
        className="group relative bg-[#0D0D12] border border-white/5 rounded-[40px] overflow-hidden p-1 shadow-2xl"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-amber/10 via-transparent to-blue-500/10 opacity-20 group-hover:opacity-40 transition-opacity" />
        
        <div className="relative z-10 p-10 space-y-8">
            {/* Header / Seal */}
            <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-[24px] bg-amber flex items-center justify-center shadow-2xl shadow-amber/40">
                    <img src="https://i.ibb.co/Y7DqXzT/clapperboard.png" alt="Track Reframe" className="w-10 h-10 object-contain invert" />
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                        <ShieldCheckIcon className="w-4 h-4 text-amber" />
                        <span className="text-[10px] font-bold text-amber uppercase tracking-widest">Certified Victory</span>
                    </div>
                    <p className="text-[9px] text-text-muted font-mono tracking-tighter">REF: {certificate.id.split("-")[0].toUpperCase()}-{new Date(certificate.issue_date).getFullYear()}</p>
                </div>
            </div>

            {/* Title & Production */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] text-amber font-bold uppercase tracking-[0.3em]">Certificate of Excellence</p>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-tight uppercase">{certificate.competition.title}</h3>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <TrophyIcon className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                        <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Organized By</p>
                        <p className="text-[10px] text-white font-bold">{certificate.production_name || "CineForge Studios"}</p>
                    </div>
                </div>
            </div>

            {/* Achievement Text */}
            <p className="text-xs text-text-muted leading-relaxed font-medium italic">
                "This certificate is awarded in recognition of outstanding creative achievement and technical excellence in filmmaking."
            </p>

            {/* Footer / Actions */}
            <div className="pt-4 flex gap-4">
                <button 
                    onClick={handleDownload}
                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                    <DownloadIcon className="w-4 h-4" />
                    View & Print
                </button>
                
                {!isClaimed ? (
                    <button 
                        onClick={handleClaim}
                        disabled={claiming}
                        className="flex-1 py-4 rounded-2xl bg-amber text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber/90 transition-all shadow-lg shadow-amber/20"
                    >
                        {claiming ? "Claiming..." : "Claim Reward"}
                    </button>
                ) : (
                    <div className="flex-1 py-4 rounded-2xl bg-success/20 border border-success/30 text-success font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                        <CheckIcon className="w-4 h-4" />
                        Claimed
                    </div>
                )}
            </div>
        </div>
    </motion.div>
  );
}
