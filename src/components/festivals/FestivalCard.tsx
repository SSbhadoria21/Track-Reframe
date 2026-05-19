"use client";

import { motion } from "framer-motion";

interface FestivalCardProps {
  festival: any;
  onViewDetails: (festival: any) => void;
  onToggleSave: (id: string, isCurrentlySaved: boolean) => void;
  isSaved: boolean;
  isSubmitted: boolean;
}

export function FestivalCard({
  festival,
  onViewDetails,
  onToggleSave,
  isSaved,
  isSubmitted,
}: FestivalCardProps) {
  // Calculate remaining days
  const now = new Date();
  const deadline = festival.active_deadline?.deadline_date
    ? new Date(festival.active_deadline.deadline_date)
    : null;

  let daysRemaining: number | null = null;
  if (deadline) {
    const diffTime = deadline.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get status pill styling
  const getDeadlinePill = () => {
    if (daysRemaining === null) {
      return (
        <span className="px-3 py-1 rounded-full bg-white/5 text-text-muted text-xs">
          No deadline listed
        </span>
      );
    }

    if (daysRemaining < 0) {
      return (
        <span className="px-3 py-1 rounded-full bg-white/5 text-text-muted text-xs">
          Deadline passed
        </span>
      );
    }

    if (daysRemaining < 15) {
      return (
        <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-pulse flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left — Urgent!
        </span>
      );
    }

    if (daysRemaining >= 15 && daysRemaining <= 30) {
      return (
        <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
          In {daysRemaining} days — Act soon!
        </span>
      );
    }

    if (daysRemaining > 30 && daysRemaining <= 60) {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber text-xs font-bold">
          In {daysRemaining} days — Plan ahead
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-text-secondary text-xs">
        In {daysRemaining} days
      </span>
    );
  };

  const hasBadge = festival.is_oscar_qualifying || festival.is_bafta_qualifying || festival.is_free;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/5 bg-surface p-5 hover:border-white/10 hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group h-[290px]"
    >
      {/* Save star badge */}
      {isSaved && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center text-amber text-xs shadow">
          ★
        </div>
      )}

      {/* Top badges (Oscar/BAFTA/Free) */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {festival.is_oscar_qualifying && (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
            Oscar Qualifying
          </span>
        )}
        {festival.is_bafta_qualifying && (
          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
            BAFTA Qualifying
          </span>
        )}
        {(festival.active_deadline?.is_free || festival.is_free) && (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
            Free Entry
          </span>
        )}
      </div>

      <div className="space-y-4 pt-3 flex-1 flex flex-col justify-between">
        {/* Name and Location */}
        <div>
          <div className="flex gap-3 items-start">
            <div className="w-11 h-11 rounded-lg bg-[#0d0d12] border border-white/5 flex items-center justify-center text-lg font-bold text-amber shrink-0 font-display">
              {festival.logo_url ? (
                <img src={festival.logo_url} alt={festival.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                festival.name.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-white group-hover:text-amber transition-colors truncate">
                {festival.name}
              </h3>
              <p className="text-xs text-text-muted">
                📍 {festival.city}, {festival.country}
              </p>
            </div>
          </div>

          {/* Film Types */}
          <div className="flex flex-wrap gap-1 mt-3">
            {festival.film_types_accepted?.slice(0, 3).map((t: string) => (
              <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-text-secondary font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Deadline section */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-text-muted">
            <span>Next Deadline</span>
            {festival.active_deadline?.deadline_date && (
              <span>
                {new Date(festival.active_deadline.deadline_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="flex justify-center py-1">
            {getDeadlinePill()}
          </div>
        </div>
      </div>

      {/* Footer Info & CTA */}
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
        <div>
          {isSubmitted ? (
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              ✓ Submitted
            </span>
          ) : (
            <span className="text-xs font-bold text-amber">
              {festival.active_deadline?.is_free || festival.is_free ? (
                "Free"
              ) : festival.active_deadline?.fee_inr ? (
                `₹${festival.active_deadline.fee_inr}`
              ) : (
                "N/A"
              )}
            </span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(festival.id, isSaved);
            }}
            className="w-8 h-8 rounded-lg border border-white/5 hover:border-amber/30 hover:bg-white/[0.02] flex items-center justify-center text-sm cursor-pointer transition-all active:scale-95"
          >
            {isSaved ? "★" : "☆"}
          </button>
          <button
            onClick={() => onViewDetails(festival)}
            className="text-xs font-bold text-text-secondary hover:text-amber transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            Details →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
