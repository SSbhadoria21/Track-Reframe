"use client";

import { motion } from "framer-motion";

interface ForgeStat {
  label: string;
  value: number;
  max: number;
  color: string;
  gradient: string;
}

// All stats start at 0 — they increase as the user creates content
const forgeStats: ForgeStat[] = [
  { label: "Storytelling", value: 0, max: 100, color: "text-amber", gradient: "from-amber/80 to-amber" },
  { label: "Cinematography", value: 0, max: 100, color: "text-indigo", gradient: "from-indigo/80 to-indigo" },
  { label: "Editing", value: 0, max: 100, color: "text-success", gradient: "from-success/80 to-success" },
  { label: "Sound Design", value: 0, max: 100, color: "text-info", gradient: "from-info/80 to-info" },
  { label: "Community", value: 0, max: 100, color: "text-purple-400", gradient: "from-purple-400/80 to-purple-400" },
];

export function CineForgeStatsBar({ userId }: { userId?: string }) {
  const totalXP = forgeStats.reduce((acc, s) => acc + s.value, 0);
  const level = Math.floor(totalXP / 50);

  return (
    <div className="px-6 mt-6">
      <div className="bg-elevated border border-white/8 rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber/20 to-indigo/20 border border-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">CineForge Score</h2>
              <span className="text-xs text-text-muted">Your filmmaker skill breakdown</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-amber">{totalXP}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Level {level}</span>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex flex-col gap-4">
          {forgeStats.map((stat, i) => (
            <div key={stat.label} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-text-secondary group-hover:text-white transition-colors">{stat.label}</span>
                <span className={`text-xs font-bold ${stat.color}`}>{stat.value}/{stat.max}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                />
              </div>
            </div>
          ))}
        </div>

        {totalXP === 0 && (
          <p className="text-xs text-text-muted text-center mt-4">Create scripts, upload films, and engage with the community to build your score!</p>
        )}
      </div>
    </div>
  );
}
