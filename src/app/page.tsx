"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
          <Link href="#" className="hover:text-white transition-colors">Tools</Link>
          <Link href="#" className="hover:text-white transition-colors">Community</Link>
          <Link href="#" className="hover:text-white transition-colors">Voices</Link>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <span className="font-mono text-xs text-amber animate-pulse">00:03:24:11</span>
          <Link href="/login" className="px-6 py-2.5 rounded-full bg-amber text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,184,0,0.3)]">
            Continue with Google
          </Link>
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
              <Link href="/signup" className="px-8 py-4 rounded-full bg-amber text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
                Get Started Now
              </Link>
              <button className="px-8 py-4 rounded-full border border-white/10 text-white font-bold text-lg hover:bg-white/5 transition-all">
                Explore the toolkit
              </button>
            </div>
          </motion.div>

          {/* Hero Visual: Animated Clapperboard */}
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
          >
            <div className="absolute inset-0 bg-amber/10 blur-[100px] rounded-full" />
            <div className="relative border border-white/10 rounded-3xl p-8 bg-[#0A0A0F]/50 backdrop-blur-xl">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest">REC</span>
                </div>
                <span className="font-mono text-[10px] text-text-muted">2.39 : 1</span>
              </div>
              
              <motion.div 
                className="w-full aspect-video bg-gradient-to-br from-white/5 to-transparent rounded-xl flex items-center justify-center relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
              >
                <ClapperboardIcon className="w-32 h-32 text-amber animate-clap origin-top" />
                <div className="absolute bottom-4 left-6 font-mono text-[10px] text-amber/60">ROLL_001 • TAKE_07</div>
              </motion.div>

              <div className="grid grid-cols-3 gap-8 mt-12">
                {[
                  { label: "ISO", val: "800" },
                  { label: "SHUT", val: "1/48" },
                  { label: "WB", val: "3200K" },
                  { label: "LENS", val: "35mm" },
                  { label: "F", val: "2.8" },
                  { label: "FPS", val: "24" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-[9px] text-text-muted font-mono uppercase mb-1">{s.label}</div>
                    <div className="text-xs font-bold font-mono">{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
            <button className="px-8 py-4 rounded-full bg-amber text-black font-bold text-lg">
              Browse rooms
            </button>
          </div>
          
          <motion.div 
            className="flex-1 w-full max-w-xl p-8 rounded-3xl bg-elevated border border-border-default shadow-2xl"
            initial={{ rotate: -2 }}
            whileInView={{ rotate: 0 }}
          >
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
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
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
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
      <footer className="py-20 px-8 border-t border-border-default">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <ClapperboardIcon className="w-8 h-8 text-amber" />
            <span className="font-display text-xl font-bold tracking-tight">Track Reframe</span>
          </div>
          
          <div className="flex gap-8 text-xs font-mono text-text-muted uppercase tracking-widest">
            <span className="text-amber">© 2026</span>
            <span>Made for Filmmakers</span>
            <span>v0.1</span>
          </div>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-amber transition-colors">T</div>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-amber transition-colors">I</div>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-amber transition-colors">Y</div>
          </div>
        </div>
      </footer>

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
