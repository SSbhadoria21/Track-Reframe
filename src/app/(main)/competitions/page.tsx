"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  TrophyIcon, 
  FilmReelIcon, 
  UsersIcon, 
  ClockIcon, 
  PlusIcon,
  SearchIcon,
  CrownIcon,
  PlayIcon,
  ShieldCheckIcon

} from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import { CreateCompetitionModal } from "@/components/competitions/CreateCompetitionModal";
import { SubmissionForm } from "@/components/competitions/SubmissionForm";
import { Leaderboard } from "@/components/competitions/Leaderboard";
import { Round2JurySuite } from "@/components/competitions/Round2JurySuite";
import { toast } from "react-hot-toast";



const TABS = ["Current Challenge", "My Challenges", "Applied", "Past Winners", "Hall of Fame"];


import { useSession } from "next-auth/react";

export default function CompetitionsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"current" | "my" | "applied" | "past" | "hall">("current");
  const [hasMounted, setHasMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [appliedComps, setAppliedComps] = useState<any[]>([]);
  const [activeComp, setActiveComp] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const handleEndEarly = async () => {
    if (!confirm("Are you sure you want to end Round 1 and proceed to Private Jury Judging (Round 2)?")) return;
    setLoading(true);
    try {
        const res = await fetch("/api/competitions", {
            method: "PATCH",
            body: JSON.stringify({ id: activeComp.id, status: "round2" })
        });
        if (res.ok) {
            toast.success("Round 1 Closed! Proceeding to Round 2 Judging.");
            fetchCompetitions();
        } else {
            const data = await res.json();
            toast.error(`Error: ${data.error || 'Failed to end round'}`);
        }

    } catch (err) {
        toast.error("Failed to end round");
    } finally {
        setLoading(false);
    }
  };


  const supabase = createClient();
  useEffect(() => {
    fetchUser();
  }, [session]);


    const fetchUser = async () => {
      const email = session?.user?.email;
      if (!email) {
        fetchCompetitions(null);
        return;
      }
      
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
        
      const activeUser = profile || session.user;
      setUser(activeUser);
      
      if (activeUser) {
        const { data: submissions } = await supabase
            .from("competition_submissions")
            .select("competition_id")
            .eq("user_id", activeUser.id);
        if (submissions) {
            setAppliedComps(submissions.map((s: any) => s.competition_id));
        }
        fetchCompetitions(activeUser);
      }
  };





  useEffect(() => {
    setHasMounted(true);
    const timer = setInterval(() => {
      if (activeComp?.round1_end) {
        setTimeLeft(calculateTimeLeft(activeComp.round1_end));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeComp]);

  const calculateTimeLeft = (deadline: string) => {
    const difference = +new Date(deadline) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const fetchCompetitions = async (currentUser?: any) => {
    setLoading(true);
    const activeUser = currentUser || user;
    const { data } = await supabase
      .from("competitions")
      .select(`
        *,
        creator:users!competitions_creator_id_fkey(username, display_name, avatar_url),
        prize_badge:badges(name, icon_url, rarity)
      `)
      .order("created_at", { ascending: false });

    if (data && activeUser) {
      // Filter logic:
      // Public: See only active rounds (upcoming, round1, round2)
      // Creator: Also sees 'finished' to perform wrap-up/closing
      const processedData = data.map((c: any) => !c.creator_id ? { ...c, creator_id: activeUser.id } : c);
      setCompetitions(processedData);
      
      const active = processedData.find((c: any) => {
          if (c.status === "archived") return false;
          if (c.creator_id === activeUser.id) {
              return ["upcoming", "round1_open", "round2", "finished"].includes(c.status);
          }
          return ["upcoming", "round1_open", "round2"].includes(c.status);
      });
      setActiveComp(active || null);
    } else if (data) {
      setCompetitions(data);
      const active = data.find((c: any) => ["upcoming", "round1_open", "round2"].includes(c.status));
      setActiveComp(active || null);
    }


    setLoading(false);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto scrollbar-hide bg-[#0A0A0F]">
      {/* Hero Banner */}
      <section className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden bg-[#0D0D12] border-b border-white/5">
        <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0F]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <TrophyIcon className="w-6 h-6 text-amber" />
            <span className="text-amber font-bold tracking-[0.3em] uppercase text-xs">Track Reframe Film Challenge</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter"
          >
            {activeComp?.title || "Next Challenge Starting Soon"}
          </motion.h1>

          {activeComp ? (
            <>
              <div className="inline-block p-1 bg-white/5 backdrop-blur-md rounded-lg mb-10 border border-white/10">
                <div className="px-8 py-3 flex flex-col items-center">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Current Theme</span>
                    <h2 className="text-2xl md:text-3xl font-display text-white relative">
                        {activeComp.theme}
                        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-amber rounded-full" />
                    </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-12 mt-10">
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center">
                        <TrophyIcon className="w-5 h-5 text-amber" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-amber uppercase tracking-wider">Prize</p>
                        <p className="text-sm font-bold text-white">{activeComp.prize_description || `${activeComp.prize_coins} Coins + Badge`}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <FilmReelIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Submissions</p>
                        <p className="text-sm font-bold text-white">
                            <CountUp value={activeComp.submission_count || 0} /> Films
                        </p>
                    </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSubmitForm(true)}
                className="px-10 py-5 rounded-full bg-amber text-black font-black text-lg uppercase tracking-tighter shadow-2xl shadow-amber/20 hover:bg-amber/90 transition-all flex items-center gap-3"
              >
                Submit Your Film <PlayIcon className="w-5 h-5 fill-black" />
              </motion.button>
            </>
          ) : (

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-md mt-10"
            >
                <TrophyIcon className="w-12 h-12 text-amber mx-auto mb-4 opacity-20" />
                <h2 className="text-2xl font-display text-white mb-2">No Active Challenge</h2>
                <p className="text-text-muted text-sm max-w-sm mx-auto">Check back later or view past winners in the tabs below.</p>
            </motion.div>
          )}

        </div>
      </section>

      {/* Admin Controls for Host - Securely visible only to creator */}
      {activeComp?.creator_id === user?.id && activeComp && (

        <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-50">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-[40px] bg-[#12121A] border-2 border-amber/30 shadow-2xl shadow-amber/10 flex flex-wrap items-center justify-between gap-6"
            >
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-amber flex items-center justify-center shadow-lg shadow-amber/20">
                        <ShieldCheckIcon className="w-8 h-8 text-black" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Host Management Hub</h3>
                        <p className="text-xs text-amber font-bold uppercase tracking-widest mt-1">Status: {activeComp.status.replace('_', ' ')}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {activeComp.status === 'upcoming' && (
                        <button 
                            onClick={async () => {
                                const res = await fetch("/api/competitions", {
                                    method: "PATCH",
                                    body: JSON.stringify({ id: activeComp.id, status: "round1_open" })
                                });
                                if (res.ok) {
                                    toast.success("Competition is now LIVE! Voting open.");
                                    fetchCompetitions();
                                } else {
                                    const data = await res.json();
                                    toast.error(`Error: ${data.error || 'Failed to start round'}`);
                                }

                            }}
                            className="px-8 py-4 rounded-2xl bg-success text-white font-black uppercase tracking-widest text-xs hover:bg-success/90 transition-all shadow-xl shadow-success/20"
                        >
                            Open Voting (Start Round 1)
                        </button>
                    )}
                    {activeComp.status === 'round1_open' && (
                        <button 
                            onClick={handleEndEarly}
                            className="px-8 py-4 rounded-2xl bg-amber text-black font-black uppercase tracking-widest text-xs hover:bg-amber/90 transition-all shadow-xl shadow-amber/20"
                        >
                            End Round 1 & Start Judging
                        </button>
                    )}

                    <button 
                        onClick={() => {
                            setEditingComp(activeComp);
                            setShowCreateModal(true);
                        }}
                        className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                    >
                        Edit Challenge
                    </button>
                </div>
            </motion.div>

            {(activeComp.status === 'round2' || activeComp.status === 'finished') && (
                <div className="mt-8">
                    <Round2JurySuite comp={activeComp} user={user} onUpdate={fetchCompetitions} />
                </div>
            )}

        </div>
      )}



      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
            <div className="flex items-center" suppressHydrationWarning>
                {TABS.map((tab) => {
                  const tabKey = tab.toLowerCase().split(" ")[0];
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tabKey as any)}
                      suppressHydrationWarning
                      className={`relative h-16 px-6 text-xs font-bold uppercase tracking-[0.2em] transition-all ${

                        isActive ? "text-amber" : "text-text-muted hover:text-white"
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber shadow-[0_0_10px_rgba(245,166,35,0.5)]"
                        />
                      )}
                    </button>
                  );
                })}
            </div>



          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
          >
            <PlusIcon className="w-4 h-4" /> Create Challenge
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "current" && activeComp && (
            <motion.div 
              key="current"

              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-12">
                <section>
                    <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                        <ClockIcon className="w-6 h-6 text-amber" /> The Brief
                    </h3>
                    <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-6">
                        <p className="text-lg text-text-secondary leading-relaxed">
                            {activeComp?.description}
                        </p>
                        
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-amber uppercase tracking-[0.2em]">Rules & Eligibility</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeComp?.rules?.split("\n").map((rule: string, i: number) => (
                                    <div key={i} className="flex gap-3 text-sm text-text-muted">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber mt-1.5 shrink-0" />
                                        {rule}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <Leaderboard compId={activeComp?.id} isAdmin={activeComp?.creator_id === user?.id} />
                </section>

              </div>

              <div className="space-y-8">
                 <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Judging Criteria</h3>
                    <div className="space-y-6">
                        <Criterion label="Story" percentage={25} />
                        <Criterion label="Direction" percentage={25} />
                        <Criterion label="Cinematography" percentage={25} />
                        <Criterion label="Originality" percentage={25} />
                    </div>
                 </div>

                 <div className="p-8 rounded-3xl bg-amber/5 border border-amber/10 space-y-6">
                    <h3 className="text-sm font-bold text-amber uppercase tracking-widest">Deadline</h3>
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        {hasMounted ? (
                          Object.entries(timeLeft).map(([label, value]) => (
                            <div key={label} className="flex flex-col items-center">
                              <div className="w-14 h-16 bg-[#1A1A25] border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group shadow-2xl">
                                <motion.span 
                                  key={value}
                                  initial={{ y: 20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  className="font-mono text-xl font-black text-amber"
                                >
                                  {value.toString().padStart(2, '0')}
                                </motion.span>
                              </div>
                              <span className="mt-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">{label.slice(0, 3)}</span>
                            </div>
                          ))
                        ) : (
                            <div className="h-16" /> 
                        )}
                      </div>
                    </div>
                 </div>
              </div>

              {/* Admin Controls were here, moved to top */}


              {/* Round 2 Jury Suite moved to top */}


            </motion.div>
          )}

          {activeTab === "current" && !activeComp && (
            <motion.div key="empty-current" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center space-y-4">
                <FilmReelIcon className="w-16 h-16 text-white/5 mx-auto" />
                <h3 className="text-xl font-bold text-white">The stage is empty...</h3>
                <p className="text-text-muted">Start a new challenge or explore the history tabs.</p>
            </motion.div>
          )}


          {activeTab === "my" && (
            <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="text-3xl font-display font-bold text-white">Challenges You Hosted</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {competitions.filter(c => c.creator_id === user?.id).map(comp => (
                        <CompetitionCard key={comp.id} comp={comp} onSelect={() => { setActiveComp(comp); setActiveTab("current"); }} />
                    ))}
                    {competitions.filter(c => c.creator_id === user?.id).length === 0 && (
                        <p className="text-text-muted py-20 text-center col-span-full">You haven't hosted any challenges yet.</p>
                    )}
                </div>
            </motion.div>
          )}

          {activeTab === "applied" && (
            <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="text-3xl font-display font-bold text-white">Challenges You Joined</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {competitions.filter(c => appliedComps.includes(c.id)).map(comp => (
                        <CompetitionCard key={comp.id} comp={comp} onSelect={() => { setActiveComp(comp); setActiveTab("current"); }} />
                    ))}
                    {competitions.filter(c => appliedComps.includes(c.id)).length === 0 && (
                        <p className="text-text-muted py-20 text-center col-span-full">You haven't submitted to any challenges yet.</p>
                    )}
                </div>
            </motion.div>
          )}


          {activeTab === "past" && (

            <motion.div 
              key="past"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <p className="text-text-muted col-span-full text-center py-20">History is still being made. Be the first winner!</p>
            </motion.div>
          )}

          {activeTab === "hall" && (
            <motion.div 
              key="hof"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
               <div className="p-10 rounded-[40px] bg-gradient-to-r from-amber/20 to-transparent border border-amber/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CrownIcon className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-32 h-32 rounded-full border-4 border-amber p-1">
                            <div className="w-full h-full rounded-full bg-surface overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Winner" alt="" />
                            </div>
                        </div>
                        <div className="text-center md:text-left space-y-4">
                            <div className="px-4 py-1 rounded-full bg-amber text-black text-[10px] font-black uppercase tracking-widest inline-block">Most Decorated Creator</div>
                            <h2 className="text-4xl font-display font-bold text-white">The Visionary</h2>
                            <p className="text-text-muted max-w-md">3 Wins • 12 Qualifications • Legendary Hall of Famer</p>
                        </div>
                    </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateCompetitionModal 
        isOpen={showCreateModal} 
        onClose={() => {
            setShowCreateModal(false);
            setEditingComp(null);
        }} 
        onSuccess={fetchCompetitions}
        initialData={editingComp}
      />


      <SubmissionForm 
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        compId={activeComp?.id}
      />
    </div>
  );
}

function CompetitionCard({ comp, onSelect }: { comp: any, onSelect: () => void }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            onClick={onSelect}
            className="group cursor-pointer p-6 rounded-3xl bg-surface border border-white/5 hover:border-amber/30 transition-all space-y-4"
        >
            <div className="aspect-video rounded-2xl bg-black/40 border border-white/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2 py-1 rounded bg-amber text-black text-[8px] font-black uppercase tracking-widest">{comp.theme}</span>
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-lg font-bold text-white group-hover:text-amber transition-colors line-clamp-1">{comp.title}</h4>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    {comp.status === 'round1_open' ? 'Ends ' : 'Started '}
                    {formatDistanceToNow(new Date(comp.round1_end), { addSuffix: true })}
                </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <TrophyIcon className="w-3 h-3 text-amber" />
                    <span className="text-xs text-white font-bold">{comp.prize_coins} Coins</span>
                </div>
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-text-muted">{comp.submission_count || 0} Entries</span>
                </div>
            </div>
        </motion.div>
    );
}

function Criterion({ label, percentage }: { label: string, percentage: number }) {

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-white">{label}</span>
                <span className="text-amber">{percentage}%</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-amber rounded-full" style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

function CountUp({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1000;
        const stepTime = Math.abs(Math.floor(duration / value));
        
        const timer = setInterval(() => {
            start += 1;
            setDisplay(start);
            if (start === value) clearInterval(timer);
        }, stepTime || 1);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{display}</span>;
}
