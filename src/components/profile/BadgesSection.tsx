"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  description: string;
  earned: string;
}

const rarityColors: Record<string, { border: string; bg: string; glow: string; label: string }> = {
  common: { border: "border-slate-400/30", bg: "bg-slate-500/10", glow: "glow-common", label: "text-slate-400" },
  rare: { border: "border-blue-400/40", bg: "bg-blue-500/10", glow: "glow-rare", label: "text-blue-400" },
  epic: { border: "border-purple-400/40", bg: "bg-purple-500/10", glow: "glow-epic", label: "text-purple-400" },
  legendary: { border: "border-amber/50", bg: "bg-amber/10", glow: "glow-legendary", label: "text-amber" },
};

export function BadgesSection({ userId }: { userId?: string }) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  // In a real app this would fetch from /api/user/badges
  // For now, starts empty — badges appear when earned
  useEffect(() => {
    // Badges are empty until the user earns them
    setBadges([]);
  }, []);

  return (
    <div className="px-6 mt-6">
      <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z" />
        </svg>
        Earned Badges
      </h2>

      {badges.length === 0 ? (
        <div className="bg-elevated border border-white/8 rounded-xl p-8 text-center">
          <span className="text-3xl mb-3 block">🎬</span>
          <p className="text-sm text-text-muted">No badges earned yet.</p>
          <p className="text-xs text-text-muted/60 mt-1">Complete challenges, upload films, and engage with the community to earn badges!</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
          {badges.map((badge, i) => {
            const colors = rarityColors[badge.rarity];
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="relative shrink-0"
                onMouseEnter={() => setHoveredBadge(badge.id)}
                onMouseLeave={() => setHoveredBadge(null)}
              >
                <div className={`w-[72px] h-[80px] hex-clip ${colors.bg} ${colors.border} border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${colors.glow}`}>
                  <span className="text-2xl select-none" style={{ animation: badge.rarity === "legendary" ? "float 3s ease-in-out infinite" : undefined }}>
                    {badge.icon}
                  </span>
                </div>
                <div className="mt-2 text-center max-w-[80px]">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.label} block truncate`}>{badge.name}</span>
                  <span className={`text-[8px] capitalize ${colors.label} opacity-60`}>{badge.rarity}</span>
                </div>
                <AnimatePresence>
                  {hoveredBadge === badge.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-[#1A1A25] border border-white/10 rounded-xl p-3 shadow-2xl z-50 pointer-events-none"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{badge.icon}</span>
                        <div>
                          <span className="text-xs font-bold text-white block">{badge.name}</span>
                          <span className={`text-[10px] capitalize font-medium ${colors.label}`}>{badge.rarity}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{badge.description}</p>
                      <span className="text-[10px] text-text-muted mt-1.5 block">Earned {badge.earned}</span>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A1A25] border-l border-t border-white/10 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
