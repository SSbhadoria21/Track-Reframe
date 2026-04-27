"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { TrophyIcon, StarIcon, PlayIcon, ExternalLinkIcon, FilmIcon, MessageSquareIcon } from "@/components/icons";
import { toast } from "react-hot-toast";

import { EntryDrawer } from "./EntryDrawer";


interface LeaderboardProps {
  compId: string;
  isAdmin?: boolean;
}

export function Leaderboard({ compId, isAdmin }: LeaderboardProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rating" | "votes" | "date">("rating");
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (compId) fetchSubmissions();
  }, [compId, sortBy]);

  const fetchSubmissions = async () => {
    let query = supabase
      .from("competition_submissions")
      .select(`
        *,
        user:users(id, username, display_name, avatar_url)
      `)
      .eq("competition_id", compId);

    if (sortBy === "rating") query = query.order("avg_rating", { ascending: false });
    if (sortBy === "votes") query = query.order("rating_count", { ascending: false });
    if (sortBy === "date") query = query.order("created_at", { ascending: false });

    const { data } = await query;
    setSubmissions(data || []);
    setLoading(false);
  };

  const handleAnnounceWinner = async (subId: string) => {
    if (!confirm("Are you sure you want to announce this winner? This will award the badge and certificate.")) return;
    
    try {
        const res = await fetch("/api/competitions/results", {
            method: "POST",
            body: JSON.stringify({
                competition_id: compId,
                winner_submission_id: subId,
                admin_note: "Congratulations on your exceptional work!"
            })
        });
        if (res.ok) {
            toast.success("Winner announced!");
            fetchSubmissions();
        } else {
            const data = await res.json();
            toast.error(data.error);
        }
    } catch (err) {
        toast.error("Failed to announce winner");
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter">Leaderboard</h3>
        
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {(["rating", "votes", "date"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                sortBy === s ? "bg-amber text-black" : "text-text-muted hover:text-white"
              }`}
            >
              By {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber/10 border border-amber/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber flex items-center justify-center shrink-0">
              <span className="text-xl">🎬</span>
          </div>
          <p className="text-[10px] md:text-xs font-bold text-amber uppercase tracking-wider leading-relaxed">
            Ratings from accounts less than 7 days old are not counted. Maximum 1 rating per user per submission. Suspicious voting patterns may disqualify entries.
          </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
          </div>
        ) : submissions.length > 0 ? (
          submissions.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedSub(sub)}
              className="group flex items-center gap-6 p-4 rounded-2xl bg-surface border border-white/5 hover:border-amber/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 w-12 text-center">
                <span className={`font-mono text-2xl font-black ${i < 3 ? "text-amber" : "text-text-muted"}`}>
                  {(i + 1).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="relative z-10 w-32 aspect-video rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                {sub.thumbnail_url ? (
                  <img src={sub.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-white/10">
                      <FilmIcon className="w-8 h-8" />
                   </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10 flex-1 min-w-0">
                <h4 className="font-bold text-white truncate group-hover:text-amber transition-colors">{sub.title}</h4>
                <div className="flex items-center gap-3 mt-1">
                   <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">
                        <img src={sub.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.user?.username}`} alt="" />
                      </div>
                      <span className="text-xs text-text-muted">@{sub.user?.username}</span>
                   </div>
                   <div className="flex gap-1">
                      {sub.genre_tags?.slice(0, 2).map((g: string) => (
                        <span key={g} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-text-muted uppercase">
                           {g}
                        </span>
                      ))}
                   </div>
                </div>
              </div>

              <div className="relative z-10 text-right pr-4">
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber font-mono">{(sub.avg_rating || 0).toFixed(1)}</span>
                    <span className="text-[10px] font-bold text-text-muted">/10</span>
                 </div>
                 <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{sub.rating_count || 0} Votes</p>
              </div>

              <div className="relative z-10">
                {sub.round1_qualified && (
                   <div className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                      Qualified
                   </div>
                )}
                {/* Legacy judging button removed - use Management Hub instead */}

                {sub.submission_status === "winner" && (
                    <div className="px-3 py-1 rounded-full bg-amber text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(245,166,35,0.4)]">
                        🏆 Winner
                    </div>
                )}
              </div>

            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-surface/50 rounded-3xl border border-white/5">
            <p className="text-text-muted italic">No entries yet. Be the first to break the ice!</p>
          </div>
        )}
      </div>

      <EntryDrawer 
        isOpen={!!selectedSub} 
        onClose={() => setSelectedSub(null)} 
        submission={selectedSub}
        onUpdate={fetchSubmissions}
      />
    </div>
  );
}
