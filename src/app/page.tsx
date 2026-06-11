"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  ClapperboardIcon, 
  ApertureIcon, 
  FilmReelIcon, 
  FilmStripIcon, 
  CameraIcon,
  SpotlightIcon
} from "@/components/icons";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DeveloperModal } from "@/components/layout/DeveloperModal";
import { CameraSimulator } from "@/components/layout/CameraSimulator";

/* ─── Animated Mouse Spotlight ─── */
function SpotlightCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[99] overflow-hidden"
      style={{
        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255, 184, 0, 0.05), transparent 80%)`
      }}
    />
  );
}

/* ─── Running Timecode ─── */
function RunningTimecode() {
  const [timecode, setTimecode] = useState("00:00:00:00");

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId: number;

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const frames = Math.floor((elapsed % 1000) / (1000 / 24)); // 24 fps

      setTimecode(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
      );
      
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <span className="font-mono text-xs text-amber font-semibold w-[85px] inline-block text-right tracking-wider">{timecode}</span>;
}

/* ─── Components ─── */

function SceneLabel({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-mono text-xs tracking-[0.3em] text-amber uppercase">SCENE {number}</span>
      <div className="h-[1px] w-12 bg-amber/30" />
      <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">{title}</span>
    </div>
  );
}

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useSpring(useTransform(scrollY, [0, 1000], [0, -150]), { stiffness: 50 });
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

  const handleProtectedAction = (path: string) => {
    if (status === "authenticated") {
      router.push(path);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-amber selection:text-black">
      <SpotlightCursor />

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-gradient-to-b from-background to-transparent px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClapperboardIcon className="w-8 h-8 text-amber" />
          <span className="font-display text-xl font-bold tracking-tight">Track Reframe</span>
        </div>
        <div className="hidden md:flex items-center gap-12 text-sm font-medium text-text-muted">
          <button onClick={() => handleProtectedAction('/studio')} className="hover:text-text-primary transition-colors">Tools</button>
          <button onClick={() => handleProtectedAction('/community')} className="hover:text-text-primary transition-colors">Community</button>
          <button onClick={() => handleProtectedAction('/competitions')} className="hover:text-text-primary transition-colors">Voices</button>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <RunningTimecode />
          {status === "authenticated" ? (
            <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-amber text-black font-bold text-lg hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,184,0,0.3)]">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </Link>
          ) : (
            <Link href="/login" className="px-6 py-2.5 rounded-full bg-amber text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,184,0,0.3)]">
              Continue with Google
            </Link>
          )}
        </div>
      </nav>

      {/* ─── SCENE 001: HERO ─── */}
      <section className="relative min-h-screen flex items-center pt-20 px-8 overflow-hidden">
        {/* Background Film Grain & Elements */}
        <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />
        <motion.div style={{ y: y1 }} className="absolute top-1/4 right-[-10%] w-[600px] h-[600px] bg-amber/5 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <SceneLabel number="001" title="INT. FILM SET - NIGHT" />
            <motion.h1 
              className="font-display text-6xl md:text-8xl lg:text-[100px] font-bold leading-[0.9] tracking-tight mb-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Where Stories <br />
              <span className="text-amber italic serif font-normal">Come to Life.</span>
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-text-secondary max-w-lg mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              A cinematic home for indie filmmakers. Write with AI in the voice of your favorite director, plan every shot, build your crew, and submit films to monthly competitions.
            </motion.p>
            <div className="flex flex-wrap gap-4">
              {status === "authenticated" ? (
                <Link href="/feed" className="px-8 py-4 rounded-full bg-amber text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
                  Go to feed
                </Link>
              ) : (
                <Link href="/login" className="px-8 py-4 rounded-full bg-amber text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
                  Get Started Now
                </Link>
              )}
              <button onClick={() => handleProtectedAction('/studio')} className="px-8 py-4 rounded-full border border-border-default text-text-primary font-bold text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                Explore the toolkit
              </button>
            </div>
          </motion.div>

          <CameraSimulator />
        </div>

        {/* Film Strip Border */}
        <div className="absolute bottom-0 left-0 right-0 h-10 border-y border-border-default bg-background">
          <div className="flex gap-4 animate-marquee py-2 h-full items-center">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} className="flex gap-4 items-center opacity-20">
                <div className="w-6 h-4 border border-white/40 rounded-sm" />
                <div className="w-6 h-4 border border-white/40 rounded-sm" />
                <div className="w-6 h-4 border border-white/40 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCENE 002: THE TOOLKIT ─── */}
      <section className="py-32 px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <SceneLabel number="002" title="THE TOOLKIT" />
          <motion.h2 
            className="font-display text-4xl md:text-6xl font-bold mb-20 max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            A film set, packed into a <span className="text-amber">browser tab.</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ApertureIcon, title: "Script Continuity AI", desc: "Stuck on a scene? Continue your screenplay in the voice of any director." },
              { icon: FilmStripIcon, title: "Script Formatter", desc: "Drop a handwritten page or raw text — get a production-ready screenplay PDF." },
              { icon: CameraIcon, title: "Shot Planner", desc: "Generate a full cinematography breakdown — shots, lenses, lighting, mood." },
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                className="group p-8 rounded-3xl bg-elevated border border-border-default hover:border-amber/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center text-amber mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCENE 003: THE CREW ─── */}
      <section className="py-32 px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-surface to-transparent" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1">
            <SceneLabel number="003" title="THE CREW" />
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-8">
              Find your DP. <br /> Build your crew. <br />
              <span className="text-amber italic serif font-normal">Make the film.</span>
            </h2>
            <p className="text-text-secondary max-w-md mb-10">
              Live chat rooms for writers, directors and cinematographers. Post a casting call, share BTS, or start a private room with an invite code.
            </p>
            <button onClick={() => handleProtectedAction('/community')} className="px-8 py-4 rounded-full bg-amber text-black font-bold text-lg hover:bg-amber-hover transition-colors">
              Browse rooms
            </button>
          </div>
          
          <motion.div 
            className="flex-1 w-full max-w-xl p-8 rounded-3xl bg-elevated border border-border-default shadow-2xl"
            initial={{ rotate: -2 }}
            whileInView={{ rotate: 0 }}
          >
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-default">
              <div className="w-2 h-2 rounded-full bg-amber" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Room • NEO_NOIR_DPS • 142 members</span>
            </div>
            <div className="space-y-6">
              {[
                { name: "nikhil_dp", msg: "Anyone tested the 24mm Sigma on FX3?" },
                { name: "maya_writes", msg: "Looking for an editor for a 12-min noir short." },
                { name: "arjun.rolls", msg: "Just wrapped principal photography. Stills 👍" },
                { name: "karan_cuts", msg: "Color graded in DaVinci 19. Game changer." },
              ].map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 border border-border-default" />
                  <div>
                    <div className="text-[10px] font-bold text-amber mb-1">@{m.name}</div>
                    <div className="text-sm text-text-secondary">{m.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SCENE 004: VOICES ─── */}
      <section className="py-32 px-8 bg-surface">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block text-center mx-auto mb-12">
            <SceneLabel number="004" title="VOICES FROM THE SET" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { text: "Felt like opening a director's notebook.", author: "Writer-Director" },
              { text: "Shot Planner saved me a full prep day.", author: "Indie DP, Mumbai" },
              { text: "The continuity AI nailed Anurag Kashyap's voice.", author: "Screenwriter" },
              { text: "The whole UI just feels like a film set.", author: "Editor" },
            ].map((v, i) => (
              <motion.div 
                key={i}
                className="p-8 rounded-2xl bg-elevated border border-border-default"
                whileHover={{ y: -10 }}
              >
                <p className="text-lg font-serif italic text-text-primary mb-6">"{v.text}"</p>
                <div className="h-[1px] w-8 bg-amber/30 mx-auto mb-4" />
                <span className="text-[10px] uppercase tracking-widest text-text-muted">— {v.author}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-20 px-8 border-t border-border-default relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ClapperboardIcon className="w-8 h-8 text-amber" />
              <span className="font-display text-xl font-bold tracking-tight">Track Reframe</span>
            </div>
            <div className="flex gap-4 text-xs font-mono text-text-muted uppercase tracking-widest">
              <span className="text-amber">© 2026</span>
              <span>Made for Filmmakers</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 text-sm font-medium text-text-secondary">
            <button onClick={() => handleProtectedAction('/studio')} className="hover:text-amber transition-colors">Studio</button>
            <button onClick={() => handleProtectedAction('/feed')} className="hover:text-amber transition-colors">Feed</button>
            <button onClick={() => handleProtectedAction('/community')} className="hover:text-amber transition-colors">Community</button>
            <button onClick={() => handleProtectedAction('/competitions')} className="hover:text-amber transition-colors">Competitions</button>
          </div>
          
          <div className="flex justify-end items-center gap-6">
            <button 
              onClick={() => setIsDeveloperModalOpen(true)}
              className="px-6 py-2.5 rounded-full border border-amber/30 text-amber font-mono text-xs uppercase tracking-widest hover:bg-amber hover:text-black transition-all shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            >
              Developer
            </button>
          </div>

        </div>
      </footer>
      
      <DeveloperModal 
        isOpen={isDeveloperModalOpen} 
        onClose={() => setIsDeveloperModalOpen(false)} 
      />

      {/* ─── Global Styles for Custom Animations ─── */}
      <style jsx global>{`
        @keyframes digit-flip {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes clap {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-30deg); }
          30% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-clap {
          animation: clap 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
