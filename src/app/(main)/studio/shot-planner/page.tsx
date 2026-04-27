"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon } from "@/components/icons";
import StoryboardFrame from "./StoryboardFrame";

/* ─── Types ─── */
interface Shot {
  shotNumber: number;
  shotType: string;
  description: string;
  cameraAngle: string;
  cameraMovement: string;
  lens: string;
  fStop: string;
  lighting: string;
  lightingMood: string;
  gear: string[];
  duration: string;
  notes: string;
  transition: string;
}

interface SceneOverview {
  estimatedDuration: string;
  dominantMood: string;
  colorPalette: string[];
  referenceFilms: string[];
  dpNotes: string;
}

interface ShotPlan {
  shots: Shot[];
  sceneOverview: SceneOverview;
}

interface StoryboardImage {
  data: string;
  mimeType: string;
  loading: boolean;
  error: string | null;
}

/* ─── Constants ─── */
const GENRES = ["Action", "Drama", "Thriller", "Romance", "Horror", "Sci-Fi", "Comedy", "Documentary", "Fantasy", "Neo-Noir"];
const MOODS = ["Tense", "Dreamy", "Gritty", "Euphoric", "Melancholic", "Chaotic", "Serene", "Mysterious", "Intimate", "Epic"];
const TIMES = ["Dawn", "Morning", "Afternoon", "Golden Hour", "Dusk", "Night", "Blue Hour", "Overcast"];
const SHOT_COUNTS = [4, 6, 8, 10, 12];

/* ─── Shot Type Badge Colors ─── */
function shotColor(type: string) {
  const t = type.toUpperCase();
  if (t.includes("WIDE") || t.includes("ESTABLISHING")) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (t.includes("CLOSE")) return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  if (t.includes("MEDIUM") || t.includes("TWO")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (t.includes("POV") || t.includes("TRACK")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  if (t.includes("AERIAL") || t.includes("CRANE")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  return "bg-amber/15 text-amber border-amber/30";
}

/* ─── Pill Selector ─── */
function PillSelector({ label, items, selected, onSelect, multi }: {
  label: string; items: string[]; selected: string | string[] | null;
  onSelect: (v: string) => void; multi?: boolean;
}) {
  const isActive = (item: string) => multi ? (selected as string[])?.includes(item) : selected === item;
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item} onClick={() => onSelect(item)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              isActive(item) ? "bg-amber text-[#0A0A0F] border-amber scale-105" : "border-white/[0.08] text-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.03]"
            }`}>{item}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Shot Card ─── */
function ShotCard({ shot, index, storyboard, onGenerateSketch }: {
  shot: Shot; index: number;
  storyboard?: StoryboardImage;
  onGenerateSketch: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group rounded-xl border border-white/[0.06] bg-surface hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
    >
      {/* Header row: storyboard thumbnail + shot info */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* Storyboard thumbnail or placeholder */}
        <div className="w-24 h-14 rounded-lg overflow-hidden shrink-0 border border-white/[0.06] bg-[#0A0A0F] flex items-center justify-center relative">
          {storyboard?.data ? (
            <img src={`data:${storyboard.mimeType};base64,${storyboard.data}`} alt={`Shot ${shot.shotNumber} storyboard`}
              className="w-full h-full object-cover" />
          ) : (
            <StoryboardFrame 
              shotType={shot.shotType}
              cameraAngle={shot.cameraAngle}
              cameraMovement={shot.cameraMovement}
              lightingMood={shot.lightingMood}
              description={shot.description}
              className="w-full h-full"
            />
          )}
          {storyboard?.loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-amber/40 border-t-amber rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="w-6 h-6 rounded bg-amber/10 flex items-center justify-center font-display font-bold text-amber text-[11px] shrink-0">
              {shot.shotNumber}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${shotColor(shot.shotType)}`}>
              {shot.shotType}
            </span>
            <span className="text-[10px] text-text-muted">{shot.duration}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{shot.description}</p>
        </div>
        <svg className={`w-4 h-4 text-text-muted shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
              {/* Storyboard Preview */}
              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0A0A0F] relative group/preview">
                {storyboard?.data ? (
                  <img src={`data:${storyboard.mimeType};base64,${storyboard.data}`}
                    alt={`Shot ${shot.shotNumber} storyboard sketch`}
                    className="w-full max-h-[320px] object-contain mx-auto" />
                ) : (
                  <div className="relative">
                    <StoryboardFrame 
                      shotType={shot.shotType}
                      cameraAngle={shot.cameraAngle}
                      cameraMovement={shot.cameraMovement}
                      lightingMood={shot.lightingMood}
                      description={shot.description}
                      className="w-full max-h-[320px]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onGenerateSketch(); }}
                        disabled={storyboard?.loading}
                        className="px-4 py-2 rounded-xl bg-amber text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-2xl"
                      >
                        {storyboard?.loading ? (
                          <div className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                        ) : "✦ AI Enhance Sketch"}
                      </button>
                    </div>
                  </div>
                )}
                {storyboard?.error && (
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-error/10 border border-error/20 rounded-lg text-[9px] text-error text-center">
                    {storyboard.error}
                  </div>
                )}
              </div>

              {/* Shot details grid */}
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Camera Angle" value={shot.cameraAngle} icon="📐" />
                <Detail label="Movement" value={shot.cameraMovement} icon="🎬" />
                <Detail label="Lens" value={shot.lens} icon="🔭" />
                <Detail label="Aperture" value={shot.fStop} icon="⚙️" />
                <div className="col-span-2"><Detail label="Lighting" value={shot.lighting} icon="💡" /></div>
                <Detail label="Lighting Mood" value={shot.lightingMood} icon="🌗" />
                <Detail label="Transition" value={shot.transition} icon="✂️" />
                {shot.gear?.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">🎥 Gear</span>
                    <div className="flex flex-wrap gap-1.5">
                      {shot.gear.map((g, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo/10 border border-indigo/20 text-indigo text-[10px]">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {shot.notes && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">📝 Notes</span>
                    <p className="text-xs text-text-secondary leading-relaxed italic">{shot.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div>
      <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-0.5">{icon} {label}</span>
      <span className="text-xs text-white font-medium">{value}</span>
    </div>
  );
}

/* ─── Scene Overview Panel ─── */
function OverviewPanel({ overview }: { overview: SceneOverview }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-indigo/20 bg-indigo/[0.04] p-5 space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-indigo/20 flex items-center justify-center text-[11px]">🎬</span>
        Scene Overview
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Duration</span>
          <span className="text-sm text-white font-medium">{overview.estimatedDuration}</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Dominant Mood</span>
          <span className="text-sm text-white font-medium">{overview.dominantMood}</span>
        </div>
      </div>
      {overview.colorPalette?.length > 0 && (
        <div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-2">Color Palette</span>
          <div className="flex gap-2">
            {overview.colorPalette.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg border border-white/10 shadow-lg" style={{ backgroundColor: c }} />
                <span className="text-[9px] text-text-muted font-mono">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {overview.referenceFilms?.length > 0 && (
        <div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Reference Films</span>
          <div className="flex flex-wrap gap-1.5">
            {overview.referenceFilms.map((f, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber text-[11px] font-medium">{f}</span>
            ))}
          </div>
        </div>
      )}
      {overview.dpNotes && (
        <div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">DP Notes</span>
          <p className="text-xs text-text-secondary leading-relaxed italic">{overview.dpNotes}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function ShotPlannerPage() {
  const [scene, setScene] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<string | null>(null);
  const [shotCount, setShotCount] = useState(8);
  const [plan, setPlan] = useState<ShotPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [storyboards, setStoryboards] = useState<Record<number, StoryboardImage>>({});
  const resultRef = useRef<HTMLDivElement>(null);

  /* ─── Storyboard generation for a single shot ─── */
  const generateStoryboard = async (shot: Shot, location?: string) => {
    const key = shot.shotNumber;
    setStoryboards((prev) => ({ ...prev, [key]: { data: "", mimeType: "", loading: true, error: null } }));
    try {
      const res = await fetch("/api/ai/shot-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotDescription: shot.description,
          shotType: shot.shotType,
          cameraAngle: shot.cameraAngle,
          lightingMood: shot.lightingMood,
          location,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        setStoryboards((prev) => ({ ...prev, [key]: { data: "", mimeType: "", loading: false, error: err.error || "Generation failed" } }));
        return;
      }
      const data = await res.json();
      setStoryboards((prev) => ({ ...prev, [key]: { data: data.image, mimeType: data.mimeType, loading: false, error: null } }));
    } catch {
      setStoryboards((prev) => ({ ...prev, [key]: { data: "", mimeType: "", loading: false, error: "Connection failed" } }));
    }
  };

  /* ─── Auto-generate storyboards after plan is created ─── */
  const generateAllStoryboards = async (shots: Shot[], loc?: string) => {
    // Generate sequentially to avoid rate limits
    for (const shot of shots) {
      await generateStoryboard(shot, loc);
      // Small delay between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  const handleGenerate = async () => {
    if (!scene.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/ai/shot-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneDescription: scene,
          genre, mood, location: location || undefined,
          timeOfDay, shotCount,
        }),
      });

      if (res.status === 429) {
        setError("Rate limit reached. Please wait a minute and try again.");
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        setError(err.error || "Failed to generate shot plan");
      } else {
        const data = await res.json();
        setPlan(data);
        setStoryboards({});
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      }
    } catch {
      setError("Failed to connect to the AI service.");
    }
    setLoading(false);
  };

  const handleExportText = () => {
    if (!plan) return;
    let text = "SHOT LIST\n" + "=".repeat(50) + "\n\n";
    if (plan.sceneOverview) {
      text += `Scene Duration: ${plan.sceneOverview.estimatedDuration}\nMood: ${plan.sceneOverview.dominantMood}\nReference Films: ${plan.sceneOverview.referenceFilms?.join(", ")}\n\n`;
    }
    plan.shots.forEach((s) => {
      text += `Shot #${s.shotNumber} — ${s.shotType}\n`;
      text += `  Description: ${s.description}\n`;
      text += `  Camera: ${s.cameraAngle} | ${s.cameraMovement}\n`;
      text += `  Lens: ${s.lens} @ ${s.fStop}\n`;
      text += `  Lighting: ${s.lighting} (${s.lightingMood})\n`;
      text += `  Duration: ${s.duration} | Transition: ${s.transition}\n`;
      if (s.gear?.length) text += `  Gear: ${s.gear.join(", ")}\n`;
      if (s.notes) text += `  Notes: ${s.notes}\n`;
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    alert("Shot list copied to clipboard!");
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <CameraIcon className="w-5 h-5 text-amber" />
          <span className="font-display text-lg font-bold">Shot Planner</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo/15 border border-indigo/30 text-indigo text-[10px] font-bold">✦ AI</span>
        </div>
        {plan && (
          <div className="flex items-center gap-2">
            <button onClick={() => setExpandAll(!expandAll)}
              className="px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
              {expandAll ? "Collapse All" : "Expand All"}
            </button>
            <button onClick={handleExportText}
              className="px-4 py-1.5 rounded-lg bg-amber text-[#0A0A0F] font-bold text-xs hover:scale-[1.02] active:scale-95 transition-transform">
              📋 Copy Shot List
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANEL — Input */}
        <div className="w-full md:w-[40%] flex flex-col border-r border-white/[0.06] overflow-y-auto scrollbar-hide p-5 gap-5">
          {/* Scene Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Describe Your Scene</label>
            <textarea value={scene} onChange={(e) => setScene(e.target.value)}
              placeholder={"e.g. A tense interrogation scene in a dimly lit police station. Detective Maya confronts the suspect across a steel table. Rain hits the window. The suspect smirks..."}
              className="w-full h-36 bg-[#0D0D12] border border-white/[0.08] rounded-xl p-4 font-sans text-sm text-text-secondary leading-relaxed resize-none focus:outline-none focus:border-amber/60 transition-colors placeholder:text-text-muted/40" />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">Be as vivid as possible for better results</span>
              <span className="text-[10px] text-text-muted">{scene.length} chars</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Location (optional)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Abandoned warehouse, Mumbai rooftop, Forest clearing..."
              className="w-full h-10 bg-[#0D0D12] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-amber/60 transition-colors placeholder:text-text-muted/40" />
          </div>

          <PillSelector label="Genre" items={GENRES} selected={genre} onSelect={(v) => setGenre(genre === v ? null : v)} />
          <PillSelector label="Mood / Tone" items={MOODS} selected={mood} onSelect={(v) => setMood(mood === v ? null : v)} />
          <PillSelector label="Time of Day" items={TIMES} selected={timeOfDay} onSelect={(v) => setTimeOfDay(timeOfDay === v ? null : v)} />

          {/* Shot Count */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Number of Shots</label>
            <div className="flex gap-2">
              {SHOT_COUNTS.map((n) => (
                <button key={n} onClick={() => setShotCount(n)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    shotCount === n ? "bg-amber text-[#0A0A0F] border-amber" : "border-white/[0.06] text-text-muted hover:text-white hover:border-white/15"
                  }`}>{n}</button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button onClick={handleGenerate} disabled={loading || !scene.trim()}
            className="w-full h-12 bg-amber text-[#0A0A0F] font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-amber/20">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" /> Generating Shot Plan...</>
            ) : (
              <>🎬 Generate Shot Plan</>
            )}
          </button>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">{error}</motion.div>
          )}
        </div>

        {/* RIGHT PANEL — Results */}
        <div ref={resultRef} className="hidden md:flex flex-1 flex-col bg-[#0A0A0F] overflow-y-auto scrollbar-hide">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber/10 flex items-center justify-center">
                  <CameraIcon className="w-8 h-8 text-amber animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-amber/30 animate-ping" />
              </div>
              <p className="text-sm text-text-muted">AI is planning your shots...</p>
              <p className="text-[11px] text-text-muted/50">Analyzing scene, selecting lenses, designing lighting</p>
            </div>
          )}

          {!plan && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-5">
                <CameraIcon className="w-10 h-10 text-text-muted/20" />
              </div>
              <p className="text-sm text-text-muted mb-1">Your AI-generated shot plan will appear here</p>
              <p className="text-xs text-text-muted/50">Describe a scene → get lens, lighting & gear for every shot</p>
            </div>
          )}

          {plan && (
            <div className="p-6 space-y-4">
              {/* Header Stats */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber/15 flex items-center justify-center text-amber text-sm font-bold">{plan.shots.length}</span>
                  <span className="text-xs text-text-muted">Shots</span>
                </div>
                {plan.sceneOverview?.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo/15 flex items-center justify-center text-indigo text-sm">⏱</span>
                    <span className="text-xs text-text-muted">{plan.sceneOverview.estimatedDuration}</span>
                  </div>
                )}
              </div>

              {/* Scene Overview */}
              {plan.sceneOverview && <OverviewPanel overview={plan.sceneOverview} />}

              {/* Shot Cards */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Shot Breakdown</h3>
                {plan.shots.map((shot, i) => (
                  <ShotCard key={i} shot={shot} index={i}
                    storyboard={storyboards[shot.shotNumber]}
                    onGenerateSketch={() => generateStoryboard(shot, location || undefined)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
