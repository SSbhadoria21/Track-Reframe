"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StatCard {
  label: string;
  value: string;
  suffix?: string;
  color?: string;
}

export function StatsRow({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Films", value: "0", color: "text-amber" },
    { label: "Scripts", value: "0", color: "text-indigo" },
    { label: "Followers", value: "0", color: "text-white" },
    { label: "Following", value: "0", color: "text-white" },
    { label: "Awards", value: "0", suffix: "🏆", color: "text-amber" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = userId ? `/api/user/stats?userId=${userId}` : "/api/user/stats";
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const s = data.stats;
          setStats([
            { label: "Films", value: String(s.films || 0), color: "text-amber" },
            { label: "Scripts", value: String(s.scripts || 0), color: "text-indigo" },
            { label: "Followers", value: s.followers >= 1000 ? `${(s.followers / 1000).toFixed(1)}K` : String(s.followers || 0), color: "text-white" },
            { label: "Following", value: String(s.following || 0), color: "text-white" },
            { label: "Awards", value: String(s.awards || 0), suffix: "🏆", color: "text-amber" },
          ]);
        }
      } catch {
        // Keep zeroed stats
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="px-6 mt-6">
      <div className="flex items-stretch gap-3 overflow-x-auto scrollbar-hide pb-1">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex-1 min-w-[120px] bg-elevated border border-white/8 rounded-xl p-4 flex flex-col items-center gap-1 hover:border-white/15 hover:bg-[#1C1C28] transition-all duration-200 cursor-default group"
          >
            <span className="text-[10px] uppercase tracking-wider font-medium text-text-muted group-hover:text-text-secondary transition-colors">
              {stat.label}
            </span>
            <span className={`text-xl font-bold ${stat.color} flex items-center gap-1`}>
              {stat.value}
              {stat.suffix && <span className="text-base">{stat.suffix}</span>}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
