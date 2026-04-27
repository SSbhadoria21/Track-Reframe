"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, PlayIcon, StarIcon, SendIcon, CheckIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

interface EntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  onUpdate: () => void;
}

export function EntryDrawer({ isOpen, onClose, submission, onUpdate }: EntryDrawerProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [canRate, setCanRate] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setWatchTime(0);
      setCanRate(false);
      const timer = setInterval(() => {
        setWatchTime(prev => {
          if (prev >= 10) {
            setCanRate(true);
            clearInterval(timer);
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const handleRate = async () => {
    if (!canRate) return toast.error("Please watch at least 10 seconds to unlock rating");
    if (rating === 0) return toast.error("Please select a rating");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/competitions/rate", {
        method: "POST",
        body: JSON.stringify({
          submission_id: submission.id,
          rating,
          comment
        })
      });
      if (res.ok) {
        toast.success("Rating submitted!");
        onUpdate();
        // Keep open or close? Let's keep open but show success
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !submission) return null;

  // Extract YouTube ID if possible
  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const id = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes("vimeo.com")) {
        const id = url.split("/").pop();
        return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-5xl h-[90vh] bg-[#0A0A0F] border-x border-t border-white/10 rounded-t-[40px] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black relative group">
                <iframe 
                    src={getVideoEmbedUrl(submission.video_link)}
                    className="w-full h-full border-none"
                    allow="autoplay; fullscreen"
                />
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full text-white transition-all z-20"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {submission.genre_tags?.map((g: string) => (
                                <span key={g} className="px-3 py-1 rounded-full bg-amber/10 border border-amber/20 text-[10px] font-black text-amber uppercase tracking-widest">
                                    {g}
                                </span>
                            ))}
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                {Math.floor(submission.runtime_seconds / 60)}:{(submission.runtime_seconds % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        <h2 className="text-4xl font-display font-bold text-white tracking-tighter">{submission.title}</h2>
                        <div className="flex items-center gap-3 p-1 pr-4 bg-white/5 rounded-full border border-white/5 w-fit">
                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                <img src={submission.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${submission.user?.username}`} alt="" />
                            </div>
                            <span className="text-sm font-bold text-white">Directed by {submission.director_name || submission.user?.display_name}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-amber uppercase tracking-[0.2em]">Synopsis</h4>
                        <p className="text-text-secondary leading-relaxed">
                            {submission.synopsis}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-amber uppercase tracking-[0.2em]">Cast</h4>
                            <div className="flex flex-wrap gap-2">
                                {submission.cast_list?.map((c: string) => (
                                    <span key={c} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-text-muted">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-amber uppercase tracking-[0.2em]">Production Crew</h4>
                            <div className="space-y-2">
                                {submission.crew_list?.map((crew: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-text-muted uppercase font-bold tracking-tighter">{crew.role}</span>
                                        <span className="text-white">{crew.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="p-8 rounded-[40px] bg-surface border border-white/5 space-y-8 sticky top-0">
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Rate this film</h3>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Your rating matters</p>
                        </div>

                        {!canRate ? (
                            <div className="space-y-4">
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(watchTime / 10) * 100}%` }}
                                        className="h-full bg-amber shadow-[0_0_10px_rgba(245,166,35,0.4)]"
                                    />
                                </div>
                                <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    Unlocking rating in {10 - watchTime}s...
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                        <button
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <StarIcon 
                                                className={`w-6 h-6 transition-colors ${
                                                    (hoverRating || rating) >= star 
                                                        ? "text-amber fill-amber" 
                                                        : "text-white/10 fill-transparent"
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <textarea 
                                        placeholder="Add a comment (optional)..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-amber/50 outline-none resize-none"
                                        rows={3}
                                    />
                                    <button 
                                        onClick={handleRate}
                                        disabled={isSubmitting || rating === 0}
                                        className="w-full py-4 rounded-2xl bg-amber text-black font-bold uppercase tracking-widest hover:bg-amber/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? "Submitting..." : (
                                            <>Submit Rating <SendIcon className="w-4 h-4 fill-black" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-white/5 space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Current Standing</span>
                                <span className="text-sm font-bold text-white">#{submission.rank || '??'}</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Votes</span>
                                <span className="text-sm font-bold text-white">{submission.rating_count}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
