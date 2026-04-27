"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { StarIcon, SendIcon, CheckIcon, XIcon, PlusIcon, FilmIcon } from "@/components/icons";
import { toast } from "react-hot-toast";

interface Round2JurySuiteProps {
  comp: any;
  user: any;
  onUpdate: () => void;
}

const THEORIES = [
    { id: 'marks_cinematography', label: 'Cinematography' },
    { id: 'marks_editing', label: 'Editing' },
    { id: 'marks_direction', label: 'Direction' },
    { id: 'marks_casting', label: 'Casting' },
    { id: 'marks_storytelling', label: 'Storytelling' },
    { id: 'marks_screenplay', label: 'Screenplay' }
];

export function Round2JurySuite({ comp, user, onUpdate }: Round2JurySuiteProps) {
  const [finalists, setFinalists] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(comp.status === "finished" || comp.status === "archived" || !!comp.winner_id);

  const [hostFeedback, setHostFeedback] = useState("");
  const supabase = createClient();



  const fetchFinalists = async () => {
    const { data } = await supabase
      .from("competition_submissions")
      .select("*, user:users(display_name, avatar_url, username)")
      .eq("competition_id", comp.id)
      .order("avg_rating", { ascending: false });
    
    if (data) setFinalists(data);
  };

  useEffect(() => {
    fetchFinalists();
  }, [comp.id]);

  useEffect(() => {
    if (selectedSub) {
        setLocalFeedback(selectedSub.jury_feedback || "");
    }
  }, [selectedSub?.id]);


  const updateJudging = async (subId: string, updates: any) => {
    setLoading(true);
    try {
        const res = await fetch("/api/competitions/judging", {
            method: "POST",
            body: JSON.stringify({
                submission_id: subId,
                scores: {
                    cinematography: updates.marks_cinematography ?? selectedSub?.marks_cinematography,
                    editing: updates.marks_editing ?? selectedSub?.marks_editing,
                    direction: updates.marks_direction ?? selectedSub?.marks_direction,
                    casting: updates.marks_casting ?? selectedSub?.marks_casting,
                    storytelling: updates.marks_storytelling ?? selectedSub?.marks_storytelling,
                    screenplay: updates.marks_screenplay ?? selectedSub?.marks_screenplay
                },
                status: updates.round2_status ?? selectedSub?.round2_status,
                feedback: updates.jury_feedback ?? selectedSub?.jury_feedback
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error);
        }

        toast.success("Judging saved privately");
        fetchFinalists();
        if (selectedSub?.id === subId) {
            setSelectedSub({ ...selectedSub, ...updates });
        }
    } catch (err: any) {
        toast.error(`Failed to save: ${err.message || 'Server error'}`);
    } finally {
        setLoading(false);
    }
  };


  const announceWinner = async (winnerSub: any) => {
    if (!confirm(`Are you sure you want to announce ${winnerSub.user.display_name} as the official winner? This will post to the community feed and issue the branded certificate.`)) return;
    
    setLoading(true);
    try {
        const res = await fetch("/api/competitions/results", {
            method: "POST",
            body: JSON.stringify({
                competition_id: comp.id,
                winner_id: winnerSub.user_id,
                submission_id: winnerSub.id
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to announce winner");
        }

        toast.success("Winner announced globally!");
        setIsFinished(true);
        // Delay update slightly to let DB propagate
        setTimeout(() => onUpdate(), 1000);

    } catch (err: any) {
        toast.error(err.message || "Announcement failed");
    } finally {
        setLoading(false);
    }
  };

  const closeChallenge = async () => {
    if (!confirm("This will archive the challenge and clear it from the 'Current Challenge' view for everyone. Continue?")) return;
    setLoading(true);
    try {
        const res = await fetch("/api/competitions/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                competition_id: comp.id,
                host_feedback: hostFeedback 
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to close challenge");
        }

        toast.success("Challenge archived and closed!");
        onUpdate();
    } catch (err: any) {
        toast.error(err.message || "Failed to close challenge");
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="mt-12 space-y-8 bg-[#0D0D12] rounded-[40px] border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-amber/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-black rotate-45" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Private Jury Workspace</h2>
                    <p className="text-[10px] text-amber font-bold uppercase tracking-[0.2em]">Private Judging Phase (Round 2)</p>
                </div>
            </div>
            <div className="flex gap-2">
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {finalists.length} Finalists Qualified
                </span>
            </div>
        </div>

        {!isFinished ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Finalist List */}
                <div className="lg:col-span-4 border-r border-white/5 h-[600px] overflow-y-auto scrollbar-hide">
                    {finalists.map((sub, i) => (
                        <button 
                            key={sub.id}
                            onClick={() => setSelectedSub(sub)}
                            className={`w-full p-6 flex items-center gap-4 text-left border-b border-white/5 transition-all ${
                                selectedSub?.id === sub.id ? 'bg-amber/10 border-l-4 border-l-amber' : 'hover:bg-white/5'
                            }`}
                        >
                            <span className="text-sm font-mono text-text-muted">{(i+1).toString().padStart(2, '0')}</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                                <img src={sub.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.user.username}`} alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{sub.title}</h4>
                                <p className="text-[10px] text-text-muted truncate">@{sub.user.username}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${
                                sub.round2_status === 'winner' ? 'bg-amber text-black' :
                                sub.round2_status === 'eliminated' ? 'bg-error/20 text-error' :
                                sub.round2_status === 'held' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-white/5 text-text-muted'
                            }`}>
                                {sub.round2_status}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Judging Area */}
                <div className="lg:col-span-8 p-8 lg:p-12 h-[600px] overflow-y-auto scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {selectedSub ? (
                            <motion.div key={selectedSub.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                {/* Scorecard & Action Buttons */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-white tracking-tight">{selectedSub.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-amber font-bold">Public Rating: {selectedSub.avg_rating || '0'}/10</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => updateJudging(selectedSub.id, { round2_status: 'eliminated' })} className="px-6 py-2 rounded-xl bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest border border-error/20 hover:bg-error/20 transition-all">Eliminate</button>
                                        <button onClick={() => updateJudging(selectedSub.id, { round2_status: 'held' })} className="px-6 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-all">Hold</button>
                                        <button 
                                            onClick={() => announceWinner(selectedSub)}
                                            className="px-6 py-2 rounded-xl bg-amber text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber/90 transition-all shadow-lg shadow-amber/20"
                                        >
                                            Announce Winner 🏆
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Theory Scorecard</h4>
                                        <div className="space-y-8">
                                            <ScoreSlider label="Cinematography" value={selectedSub.marks_cinematography || 5} onChange={(val) => updateJudging(selectedSub.id, { marks_cinematography: val })} />
                                            <ScoreSlider label="Editing" value={selectedSub.marks_editing || 5} onChange={(val) => updateJudging(selectedSub.id, { marks_editing: val })} />
                                            <ScoreSlider label="Direction" value={selectedSub.marks_direction || 5} onChange={(val) => updateJudging(selectedSub.id, { marks_direction: val })} />
                                            <ScoreSlider label="Casting" value={selectedSub.marks_casting || 5} onChange={(val) => updateJudging(selectedSub.id, { marks_casting: val })} />
                                            <ScoreSlider label="Storytelling" value={selectedSub.marks_storytelling || 5} onChange={(val) => updateJudging(selectedSub.id, { marks_storytelling: val })} />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Jury Feedback</h4>
                                        <textarea 
                                            placeholder="Provide constructive feedback based on film making theories..."
                                            value={localFeedback}
                                            onChange={(e) => setLocalFeedback(e.target.value)}
                                            onBlur={(e) => updateJudging(selectedSub.id, { jury_feedback: e.target.value })}
                                            className="w-full h-[300px] bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white focus:border-amber/50 outline-none resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 animate-spin" />
                                <p className="text-sm text-text-muted">Select a finalist to begin judging</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 bg-success/5 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-3xl font-bold text-white tracking-tighter">🏆 Winner Announced!</h3>
                        <p className="text-sm text-text-muted mt-2 max-w-md leading-relaxed">
                            The professional jury phase is complete. Every participant has been notified and certificates have been issued.
                        </p>
                    </div>
                    <button 
                        onClick={closeChallenge}
                        className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-2xl shadow-white/20"
                    >
                        Close & Archive Challenge
                    </button>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-success uppercase tracking-[0.2em] mb-4 block">How was your experience hosting this challenge?</label>
                        <textarea 
                            placeholder="Share how fruitful and amazing it was to organize this... Your feedback helps us improve the festival experience."
                            value={hostFeedback}
                            onChange={(e) => setHostFeedback(e.target.value)}
                            className="w-full h-40 bg-black/40 border border-white/10 rounded-[32px] p-8 text-white focus:border-success/50 outline-none resize-none leading-relaxed shadow-inner"
                        />
                    </div>
                </div>
            </motion.div>
        )}
    </div>
  );
}

function ScoreSlider({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</span>
                <span className="text-sm font-mono text-amber font-bold">{value}/10</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden group">
                <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber/40 to-amber shadow-[0_0_10px_rgba(245,166,35,0.4)] transition-all duration-300"
                    style={{ width: `${(value / 10) * 100}%` }}
                />
                <input 
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
            </div>
        </div>
    );
}
