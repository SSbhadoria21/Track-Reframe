"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ApertureIcon,
  CameraIcon,
  FilmStripIcon,
  FilmReelIcon,
  ClapperboardIcon,
  SpotlightIcon,
} from "@/components/icons";

const HERO_TOOLS = [
  {
    title: "Script Continuity AI",
    desc: "Continue your stuck script in any director's style. Powered by Claude AI.",
    icon: ApertureIcon,
    href: "/studio/script-continuity",
    badge: "✦ AI Powered",
    stat: "Used by 1,200+ creators",
    accent: "indigo",
  },
  {
    title: "Script Formatter",
    desc: "Handwriting or text → professional WGA screenplay PDF with live preview.",
    icon: FilmStripIcon,
    href: "/studio/script-formatter",
    badge: null,
    stat: "18,000+ scripts formatted",
    accent: "amber",
  },
  {
    title: "Shot Planner",
    desc: "Visual shot-by-shot AI planning with lens, lighting & gear recommendations.",
    icon: CameraIcon,
    href: "/studio/shot-planner",
    badge: "✦ AI Powered",
    stat: "340+ shot plans created",
    accent: "indigo",
  },
];

const SECONDARY_TOOLS = [
  { title: "Mood Board Generator", desc: "AI-generated visual mood boards from scene descriptions.", icon: SpotlightIcon, href: "/studio/mood-board" },
  { title: "Budget Estimator", desc: "Estimate your film's budget based on project parameters.", icon: ClapperboardIcon, href: "/studio/budget-estimator" },
  { title: "Call Sheet Generator", desc: "Generate professional call sheets for your shoot days.", icon: FilmReelIcon, href: "/studio/call-sheet" },
  { title: "Director Style Analyzer", desc: "Analyze any director's signature techniques.", icon: ApertureIcon, href: "/studio/director-analyzer" },
  { title: "Find Your Crew", desc: "Post listings and find collaborators for your project.", icon: CameraIcon, href: "/studio/find-crew" },
  { title: "Collaborative Editor", desc: "Real-time multi-writer screenplay editing.", icon: FilmStripIcon, href: "/studio/collab-editor" },
];

export default function StudioPage() {
  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <h1 className="font-display text-3xl md:text-[40px] font-bold">Track Reframe Studio</h1>
        <ApertureIcon className="w-8 h-8 text-amber animate-[spin_4s_linear_infinite]" />
      </div>
      <div className="flex items-center gap-3 mb-10">
        <span className="text-sm md:text-lg text-text-secondary">Professional filmmaking tools that think like a director.</span>
        <span className="px-2.5 py-1 rounded-full bg-indigo/15 border border-indigo/30 text-indigo text-[11px] font-bold">✦ AI Powered</span>
      </div>

      {/* Hero Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        {HERO_TOOLS.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <Link
              href={tool.href}
              className={`group flex flex-col h-full min-h-[280px] rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${
                tool.accent === "indigo"
                  ? "bg-surface border-indigo/20 hover:border-indigo/40 hover:shadow-[0_0_30px_rgba(108,99,255,0.1)]"
                  : "bg-surface border-amber/20 hover:border-amber/40 hover:shadow-[0_0_30px_rgba(245,166,35,0.1)]"
              }`}
            >
              {/* Glow bg */}
              <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl transition-opacity opacity-20 group-hover:opacity-40 ${
                tool.accent === "indigo" ? "bg-indigo/30" : "bg-amber/30"
              }`} />

              <div className="relative z-10 flex flex-col flex-1">
                <tool.icon className={`w-16 h-16 mb-5 ${tool.accent === "indigo" ? "text-indigo" : "text-amber"}`} />
                <h2 className="text-xl font-bold mb-2">{tool.title}</h2>

                {tool.badge && (
                  <span className="inline-flex w-max px-2.5 py-1 rounded-full bg-indigo/15 border border-indigo/30 text-indigo text-[10px] font-bold mb-3">
                    {tool.badge}
                  </span>
                )}

                <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-1">{tool.desc}</p>
                <span className="text-[11px] text-text-muted mb-4">{tool.stat}</span>

                <span className={`inline-flex w-max items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-transform group-hover:scale-[1.03] ${
                  tool.accent === "indigo"
                    ? "bg-indigo text-white"
                    : "bg-amber text-[#0A0A0F]"
                }`}>
                  Open Tool →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Secondary Tools */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">More Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECONDARY_TOOLS.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
          >
            <Link
              href={tool.href}
              className="group flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] bg-surface hover:border-white/15 hover:bg-elevated transition-all duration-200"
            >
              <tool.icon className="w-10 h-10 text-amber shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold mb-1 group-hover:text-amber transition-colors">{tool.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{tool.desc}</p>
              </div>
              <span className="text-text-muted group-hover:text-amber transition-colors text-lg mt-1">→</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
