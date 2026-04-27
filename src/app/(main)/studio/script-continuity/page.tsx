"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApertureIcon } from "@/components/icons";

const DIRECTORS = [
  { name: "Anurag Kashyap", flag: "🇮🇳", traits: ["Gritty realism", "Non-linear", "Dark humor"] },
  { name: "S.S. Rajamouli", flag: "🇮🇳", traits: ["Epic scale", "Visual spectacle", "Heroic arcs"] },
  { name: "Zoya Akhtar", flag: "🇮🇳", traits: ["Slice of life", "Ensemble cast", "Musical energy"] },
  { name: "Sanjay Leela Bhansali", flag: "🇮🇳", traits: ["Opulent visuals", "Tragedy", "Grand sets"] },
  { name: "Christopher Nolan", flag: "🇬🇧", traits: ["Non-linear time", "IMAX scale", "Cerebral"] },
  { name: "Quentin Tarantino", flag: "🇺🇸", traits: ["Sharp dialogue", "Nonlinear", "Violence"] },
  { name: "Martin Scorsese", flag: "🇺🇸", traits: ["Character study", "Voiceover", "Crime"] },
  { name: "Wes Anderson", flag: "🇺🇸", traits: ["Symmetry", "Pastel palette", "Deadpan humor"] },
  { name: "Denis Villeneuve", flag: "🇨🇦", traits: ["Slow burn", "Atmosphere", "Sci-fi"] },
  { name: "Bong Joon-ho", flag: "🇰🇷", traits: ["Genre blend", "Social satire", "Suspense"] },
  { name: "Park Chan-wook", flag: "🇰🇷", traits: ["Revenge themes", "Visual poetry", "Dark"] },
  { name: "Wong Kar-wai", flag: "🇭🇰", traits: ["Mood-driven", "Romantic", "Neon visuals"] },
  { name: "David Fincher", flag: "🇺🇸", traits: ["Precision", "Dark thriller", "Unreliable narrator"] },
  { name: "Rohit Shetty", flag: "🇮🇳", traits: ["Action masala", "Comedy", "Car chases"] },
  { name: "Imtiaz Ali", flag: "🇮🇳", traits: ["Road journeys", "Romance", "Self-discovery"] },
  { name: "Vishal Bhardwaj", flag: "🇮🇳", traits: ["Shakespeare adapt", "Dark drama", "Musical"] },
];

const TONES = ["Intense", "Comic", "Emotional", "Thriller", "Romantic"];

export default function ScriptContinuityPage() {
  const [script, setScript] = useState("");
  const [markerLine, setMarkerLine] = useState<number | null>(null);
  const [selectedDirector, setSelectedDirector] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState("");
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [lengthChoice, setLengthChoice] = useState("medium");
  const [directorSearch, setDirectorSearch] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const filteredDirectors = DIRECTORS.filter((d) =>
    d.name.toLowerCase().includes(directorSearch.toLowerCase())
  );
  const scriptLines = script.split("\n");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const callAI = async (inputText: string, append = false) => {
    setIsGenerating(true);
    setStreamDone(false);
    if (!append) setOutput("");

    try {
      const res = await fetch("/api/ai/script-continuity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText: inputText,
          continuationLineIndex: append ? null : markerLine,
          directorSlug: selectedDirector,
          customStyle: selectedDirector === "__custom__" ? customStyle : undefined,
          toneArray: selectedTones,
          lengthChoice,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        const errMsg = `Error: ${err.error || "Generation failed"}`;
        setOutput(append ? output + "\n\n" + errMsg : errMsg);
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = append ? output + "\n\n" : "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setOutput(accumulated);
          outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
        }
      }
    } catch {
      setOutput(append ? output + "\n\nError: Failed to connect." : "Error: Failed to connect.");
    } finally {
      setIsGenerating(false);
      setStreamDone(true);
    }
  };

  const handleGenerate = () => { if (script.trim()) callAI(script); };
  const handleRegenerate = () => { if (script.trim()) callAI(script); };
  const handleContinueFurther = () => callAI(script + "\n\n" + output, true);
  const handleCopyAll = () => { navigator.clipboard.writeText(output); showToast("Copied to clipboard!"); };

  const handleSaveToScripts = async () => {
    if (!output.trim()) return;
    setIsSaving(true);
    try {
      const dirLabel = selectedDirector === "__custom__" ? "Custom" : selectedDirector || "Default";
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `AI Script — ${dirLabel} style`,
          raw_text: script,
          formatted_text: output,
          director_name: dirLabel,
          tool_used: "continuity_ai",
          genre_tags: selectedTones,
        }),
      });
      if (res.ok) showToast("Script saved to your dashboard! 💾");
      else {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        showToast(err.error || "Save failed", "error");
      }
    } catch { showToast("Failed to save script", "error"); }
    finally { setIsSaving(false); }
  };

  function renderOutput(text: string) {
    return text.split("\n").map((line, i) => {
      const t = line.trim();
      if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(t)) return <div key={i} className="text-amber font-bold uppercase mt-4 mb-1 text-[13px]">{t}</div>;
      if (t === t.toUpperCase() && t.length < 35 && /^[A-Z\s.'-]+$/.test(t) && t.length > 1) return <div key={i} className="text-center font-bold uppercase mt-3 mb-0.5 text-[13px]">{t}</div>;
      if (t.startsWith("(") && t.endsWith(")")) return <div key={i} className="text-center italic text-white/60 text-[12px] pl-8 pr-6">{t}</div>;
      if (/^(CUT TO:|FADE OUT\.|FADE IN:)/i.test(t)) return <div key={i} className="text-right text-text-muted uppercase text-[13px] mt-3">{t}</div>;
      if (!t) return <div key={i} className="h-3" />;
      return <div key={i} className="text-[#E8E8E0] text-[13px] leading-relaxed mb-1">{t}</div>;
    });
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
              toast.type === "success" ? "bg-success/10 border-success/30 text-success" : "bg-error/10 border-error/30 text-error"
            }`}>{toast.message}</motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <ApertureIcon className="w-5 h-5 text-amber" />
          <span className="font-display text-lg font-bold">Script Continuity AI</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo/15 border border-indigo/30 text-indigo text-[10px] font-bold">✦ AI</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-full md:w-[40%] flex flex-col border-r border-white/[0.06] overflow-y-auto scrollbar-hide p-5 gap-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Your Script</label>
            <div className="relative bg-[#0D0D12] rounded-lg border border-white/[0.08] overflow-hidden">
              <div className="max-h-[280px] overflow-y-auto scrollbar-hide p-4 pl-12 font-screenplay text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap" contentEditable={false}>
                {scriptLines.map((line, i) => (
                  <div key={i} onClick={() => setMarkerLine(markerLine === i ? null : i)}
                    className={`cursor-pointer hover:bg-white/[0.03] px-1 -mx-1 rounded relative ${markerLine !== null && i <= markerLine ? "opacity-50" : ""}`}>
                    {line || "\u00A0"}
                    {markerLine === i && <div className="absolute left-0 right-0 -bottom-px h-[2px] border-b-2 border-dashed border-amber" />}
                  </div>
                ))}
              </div>
              <div className="absolute left-0 top-0 bottom-0 w-9 bg-[#0A0A0F] border-r border-white/[0.04] overflow-hidden pointer-events-none">
                <div className="p-4 pr-2 text-right">
                  {scriptLines.map((_, i) => <div key={i} className="text-[10px] text-text-muted/40 font-mono leading-relaxed">{i + 1}</div>)}
                </div>
              </div>
            </div>
            <textarea value={script} onChange={(e) => { setScript(e.target.value); setMarkerLine(null); }}
              placeholder="Paste your script here, or type directly..."
              className="w-full mt-2 h-24 bg-[#0D0D12] border border-white/[0.08] rounded-lg p-3 font-screenplay text-[13px] text-text-secondary resize-none focus:outline-none focus:border-amber transition-colors" />
            {markerLine !== null && <p className="text-[11px] text-amber mt-1">Continuing from line {markerLine + 1} →</p>}
          </div>

          {/* Director Style */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">
              <span className="border-b border-amber pb-0.5">Choose a directorial style</span>
            </label>
            <input value={directorSearch} onChange={(e) => setDirectorSearch(e.target.value)} placeholder="Search directors..."
              className="w-full h-9 bg-[#0D0D12] border border-white/[0.08] rounded-md px-3 text-sm text-white focus:outline-none focus:border-amber mb-2" />
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto scrollbar-hide">
              <div onClick={() => setSelectedDirector(selectedDirector === "__custom__" ? null : "__custom__")}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${selectedDirector === "__custom__" ? "border-indigo bg-indigo/10" : "border-white/[0.06] hover:bg-white/[0.03]"}`}>
                <span className="font-bold text-xs">✦ Custom Style</span>
              </div>
              {filteredDirectors.map((d) => (
                <div key={d.name} onClick={() => setSelectedDirector(selectedDirector === d.name ? null : d.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedDirector === d.name ? "border-indigo bg-indigo/10" : "border-white/[0.06] hover:bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs truncate">{d.name}</span>
                    <span className="text-sm">{d.flag}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.traits.map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
            {selectedDirector === "__custom__" && (
              <textarea value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} placeholder="Describe the style you want..."
                className="w-full mt-2 h-20 bg-[#0D0D12] border border-white/[0.08] rounded-lg p-3 text-xs text-white resize-none focus:outline-none focus:border-indigo" />
            )}
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Tone & mood</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setSelectedTones(selectedTones.includes(t) ? selectedTones.filter((x) => x !== t) : [...selectedTones, t])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTones.includes(t) ? "bg-amber text-[#0A0A0F] border-amber" : "border-amber/30 text-amber hover:bg-amber/10"}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Length</label>
            <div className="flex gap-2">
              {[{ val: "short", label: "Short (~500)" }, { val: "medium", label: "Medium (~1,000)" }, { val: "long", label: "Long (~2,000)" }].map((l) => (
                <button key={l.val} onClick={() => setLengthChoice(l.val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${lengthChoice === l.val ? "bg-white/10 border-white/20 text-white" : "border-white/[0.06] text-text-muted hover:text-white"}`}>{l.label}</button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || !script.trim()}
            className="w-full h-12 bg-amber text-[#0A0A0F] font-bold rounded-lg text-sm hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2">
            {isGenerating ? <><span className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" /> Generating...</> : "Continue My Story →"}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="hidden md:flex flex-1 flex-col bg-[#0D0D12] overflow-hidden">
          {isGenerating && (
            <div className="flex items-center gap-2 px-6 py-3 border-b border-indigo/20 bg-indigo/5">
              <span className="w-2 h-2 rounded-full bg-indigo animate-pulse" />
              <span className="text-xs text-indigo font-medium">✦ AI is writing in {selectedDirector === "__custom__" ? "custom" : selectedDirector || "default"} style...</span>
            </div>
          )}

          <div ref={outputRef} className="flex-1 overflow-y-auto scrollbar-hide p-8 font-screenplay">
            {!output && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ApertureIcon className="w-16 h-16 text-white/[0.06] mb-4" />
                <p className="text-sm text-text-muted">Your AI-generated screenplay continuation will appear here.</p>
                <p className="text-xs text-text-muted/60 mt-1">Paste a script, choose a style, and click Generate.</p>
              </div>
            )}
            {output && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {streamDone && selectedDirector && (
                  <div className="mb-6 inline-flex px-3 py-1.5 rounded-full bg-indigo/15 border border-indigo/30 text-indigo text-[11px] font-medium">
                    Generated in {selectedDirector === "__custom__" ? "custom" : selectedDirector} style
                    {selectedTones.length > 0 && ` • ${selectedTones.join(" + ")}`}
                  </div>
                )}
                {renderOutput(output)}
              </motion.div>
            )}
          </div>

          {/* Action bar — FULLY FUNCTIONAL */}
          {streamDone && output && (
            <div className="flex items-center gap-3 px-6 py-3 border-t border-white/[0.06] bg-surface/50">
              <button onClick={handleRegenerate} disabled={isGenerating}
                className="px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">↺ Regenerate</button>
              <button onClick={handleContinueFurther} disabled={isGenerating}
                className="px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">⊕ Continue Further</button>
              <button onClick={handleCopyAll}
                className="px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors">⧉ Copy All</button>
              <button onClick={handleSaveToScripts} disabled={isSaving}
                className="px-3 py-2 rounded-lg border border-amber/20 text-xs text-amber hover:bg-amber/10 transition-colors disabled:opacity-50 flex items-center gap-1">
                {isSaving ? <><span className="w-3 h-3 border-2 border-amber border-t-transparent rounded-full animate-spin" /> Saving...</> : "💾 Save to Scripts"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
