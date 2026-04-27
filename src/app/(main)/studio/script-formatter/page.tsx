"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilmStripIcon } from "@/components/icons";
import { exportScreenplayPDF } from "./pdf-export";

/* ─── Screenplay Parser (industry-standard detection) ─── */
export type ParsedLine = { type: string; text: string };

function parseScreenplay(text: string): ParsedLine[] {
  if (!text.trim()) return [];
  const lines = text.split("\n");
  const parsed: ParsedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { parsed.push({ type: "blank", text: "" }); continue; }

    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(line)) {
      parsed.push({ type: "scene_heading", text: line.toUpperCase() });
    } else if (/^(FADE IN:|FADE OUT\.|FADE TO BLACK\.|CUT TO:|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:)/i.test(line)) {
      parsed.push({ type: "transition", text: line.toUpperCase() });
    } else if (line.endsWith(":") && line === line.toUpperCase() && line.length < 25 && !/^(INT|EXT)/i.test(line)) {
      parsed.push({ type: "transition", text: line });
    } else if (line.startsWith("(") && line.endsWith(")")) {
      parsed.push({ type: "parenthetical", text: line });
    } else if (
      line === line.toUpperCase() &&
      line.length < 45 &&
      /^[A-Z][A-Z\s.'\-()0-9]+$/.test(line) &&
      !line.endsWith(".") &&
      parsed.length > 0 &&
      parsed[parsed.length - 1].type !== "character"
    ) {
      parsed.push({ type: "character", text: line });
    } else if (
      parsed.length > 0 &&
      (parsed[parsed.length - 1].type === "character" ||
       parsed[parsed.length - 1].type === "parenthetical" ||
       parsed[parsed.length - 1].type === "dialogue")
    ) {
      parsed.push({ type: "dialogue", text: line });
    } else {
      parsed.push({ type: "action", text: line });
    }
  }
  return parsed;
}

/* ─── Toggle Switch ─── */
function Toggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-2">
      <span className="text-sm text-text-secondary group-hover:text-white transition-colors">{label}</span>
      <button type="button" onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-amber" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

/* ─── Metadata Modal ─── */
function MetadataModal({ onSubmit, onSkip }: { onSubmit: (m: any) => void; onSkip: () => void }) {
  const [form, setForm] = useState({ title: "", writer: "", director: "", production: "", contact: "", draft: "1", date: new Date().toISOString().split("T")[0] });
  const fields = [
    { key: "title", label: "Film / Script Title", span: true, required: true, placeholder: "e.g. The Last Frame" },
    { key: "writer", label: "Written by", placeholder: "Writer name" },
    { key: "director", label: "Director", placeholder: "Director name" },
    { key: "production", label: "Production House", placeholder: "Production company" },
    { key: "contact", label: "Contact (Email / Phone)", placeholder: "producer@studio.com" },
    { key: "draft", label: "Draft #", placeholder: "1" },
    { key: "date", label: "Date", placeholder: "2026-01-01" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#111118] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2m10 0V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold">Script Details</h3>
              <p className="text-xs text-text-muted">This info appears on the title page of your screenplay</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.span ? "col-span-2" : ""}>
              <label className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                {f.label} {f.required && <span className="text-amber">*</span>}
              </label>
              <input value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full h-10 bg-[#0A0A0F] border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-text-muted/50 focus:outline-none focus:border-amber/60 transition-colors mt-1" />
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex items-center justify-between">
          <button onClick={onSkip} className="text-sm text-text-muted hover:text-white transition-colors">Skip for now</button>
          <button onClick={() => onSubmit(form)}
            className="px-6 py-2.5 rounded-xl bg-amber text-[#0A0A0F] font-bold text-sm hover:bg-amber-hover transition-colors">
            Continue to Format
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Detect if text looks like raw/rough (not screenplay) ─── */
function isRoughText(text: string): boolean {
  if (!text || text.length < 50) return false;
  const trimmed = text.trim();
  const lines = trimmed.split("\n").filter(l => l.trim());
  
  // Basic screenplay markers
  const hasSceneHeading = lines.some(l => /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(l.trim()));
  const allCapsLines = lines.filter(l => l.trim() === l.trim().toUpperCase() && l.trim().length > 2 && l.trim().length < 40);
  
  // If it's one big block of text without scene headings, it's rough
  if (!hasSceneHeading && lines.length <= 3 && trimmed.length > 100) return true;
  
  // If there are many lines but almost no scene headings or character names (all caps), it's rough
  if (!hasSceneHeading && allCapsLines.length < 2 && lines.length > 2) return true;
  
  return false;
}

const LANGUAGES = [
  "Auto-detect", "English", "Hindi", "Tamil", "Telugu", "Bengali",
  "Marathi", "Kannada", "Malayalam", "Gujarati", "Punjabi", "Urdu",
  "French", "Spanish", "Korean", "Japanese",
];

/* ─── Convert / Enhance Banner ─── */
function ActionBanner({ mode, onAction, loading, language, onLangChange }: {
  mode: "convert" | "enhance";
  onAction: () => void; loading: boolean;
  language: string; onLangChange: (l: string) => void;
}) {
  const isConvert = mode === "convert";
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`mx-5 mt-3 p-3 rounded-xl border flex flex-col gap-2 ${
        isConvert
          ? "bg-gradient-to-r from-amber/10 to-indigo/10 border-amber/20"
          : "bg-gradient-to-r from-indigo/10 to-amber/10 border-indigo/20"
      }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isConvert ? "bg-amber/20" : "bg-indigo/20"}`}>
          {isConvert ? (
            <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white">
            {isConvert ? "This looks like a rough draft" : "AI can enhance your script"}
          </p>
          <p className="text-[10px] text-text-muted">
            {isConvert
              ? "AI will convert it into a proper screenplay with scenes, characters & dialogue"
              : "Improve dialogue, tighten action lines, fix formatting"}
          </p>
        </div>
        <button onClick={onAction} disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5 ${
            isConvert ? "bg-amber hover:bg-amber-hover" : "bg-indigo hover:bg-indigo-hover"
          }`}>
          {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {loading ? (isConvert ? "Converting…" : "Enhancing…") : (isConvert ? "Convert to Screenplay" : "Enhance")}
        </button>
      </div>
      {isConvert && (
        <div className="flex items-center gap-2 pl-11">
          <span className="text-[10px] text-text-muted">Language:</span>
          <select value={language} onChange={(e) => onLangChange(e.target.value)}
            className="bg-[#0A0A0F] border border-white/[0.08] rounded-md px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-amber/60">
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}
    </motion.div>
  );
}

const EMPTY_META = { title: "", writer: "", director: "", production: "", contact: "", draft: "1", date: new Date().toISOString().split("T")[0] };

export default function ScriptFormatterPage() {
  const [rawText, setRawText] = useState("");
  const [meta, setMeta] = useState(EMPTY_META);
  const [showMeta, setShowMeta] = useState(false);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [hasBeenPrompted, setHasBeenPrompted] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [bannerMode, setBannerMode] = useState<"convert" | "enhance" | null>(null);
  const [language, setLanguage] = useState("Auto-detect");
  const [opts, setOpts] = useState({
    titlePage: true, pageNumbers: true, sceneNumbers: true,
    watermark: false, watermarkText: "DRAFT",
  });

  useEffect(() => {
    if (rawText.length > 50) {
      const rough = isRoughText(rawText);
      setBannerMode(rough ? "convert" : "enhance");
    } else {
      setBannerMode(null);
    }
  }, [rawText]);

  const parsed = useMemo(() => parseScreenplay(rawText), [rawText]);
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  // Split parsed lines into A4 pages for preview
  const pages = useMemo(() => {
    if (!parsed.length) return [];
    const p: (typeof parsed)[] = [[]];
    let currentY = 0;
    const PAGE_HEIGHT = 700; // Estimated usable height in units

    parsed.forEach(line => {
      let h = 18; // Default action/blank line height
      if (line.type === "scene_heading") h = 44;
      if (line.type === "character") h = 32;
      if (line.type === "parenthetical") h = 18;
      if (line.type === "dialogue") {
        // Rough estimate of wrapped line count
        const charLimit = 35; 
        const lineCount = Math.ceil(line.text.length / charLimit);
        h = lineCount * 18;
      }
      if (line.type === "transition") h = 36;
      if (line.type === "blank") h = 18;

      if (currentY + h > PAGE_HEIGHT && p[p.length - 1].length > 0) {
        p.push([line]);
        currentY = h;
      } else {
        p[p.length - 1].push(line);
        currentY += h;
      }
    });
    return p;
  }, [parsed]);

  // When user pastes content, show the metadata modal
  const handleTextChange = useCallback((value: string) => {
    const prevLen = rawText.length;
    setRawText(value);
    // Detect paste: large jump in length (>60 chars added at once) or multiline content
    const isPaste = (value.length - prevLen) > 60;
    const isSubstantial = value.length > 100 && (value.includes("\n") || value.length > 200);
    if (!hasBeenPrompted && isSubstantial && isPaste) {
      setHasBeenPrompted(true);
      setTimeout(() => setShowMetaModal(true), 300);
    }
  }, [hasBeenPrompted, rawText.length]);

  const handleMetaSubmit = (m: typeof meta) => {
    setMeta(m);
    setShowMetaModal(false);
  };

  const handleExportPDF = () => {
    if (!rawText.trim()) return;
    exportScreenplayPDF(parsed, meta, opts);
  };

  const handleEnhance = async () => {
    if (!rawText.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/ai/enhance-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: rawText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enhanced) { 
          setRawText(data.enhanced); 
          setBannerMode("enhance");
          alert("Script enhanced successfully!");
        }
      } else if (res.status === 429) {
        alert("Rate limit reached: The AI is currently busy. Please wait about 60 seconds before trying again.");
      } else {
        const err = await res.json();
        alert("Failed to enhance script: " + (err.error || "Unknown error"));
      }
    } catch (e: any) {
      console.error("Enhance error:", e);
      alert("Error connecting to script enhancement service.");
    }
    setEnhancing(false);
  };

  const handleConvert = async () => {
    if (!rawText.trim() || converting) return;
    setConverting(true);
    try {
      const res = await fetch("/api/ai/convert-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, language: language === "Auto-detect" ? undefined : language }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.formatted) { 
          setRawText(data.formatted); 
          setBannerMode("enhance");
          alert("Conversion complete! Your script is now properly formatted.");
        }
      } else if (res.status === 429) {
        alert("Rate limit reached: You've made too many requests too quickly. Please wait a minute and try again.");
      } else {
        const err = await res.json();
        alert("Failed to convert script: " + (err.error || "Unknown error"));
      }
    } catch (e: any) {
      console.error("Convert error:", e);
      alert("Error connecting to script conversion service.");
    }
    setConverting(false);
  };

  let sceneIdx = 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
      {/* Metadata Modal */}
      <AnimatePresence>
        {showMetaModal && (
          <MetadataModal
            onSubmit={handleMetaSubmit}
            onSkip={() => setShowMetaModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <FilmStripIcon className="w-5 h-5 text-amber" />
          <span className="font-display text-lg font-bold">Script Formatter</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{wordCount.toLocaleString()} words</span>
          <button onClick={handleExportPDF} disabled={!rawText.trim()}
            className="px-4 py-2 rounded-lg bg-amber text-[#0A0A0F] font-bold text-sm hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100">
            Export as PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ─── LEFT PANEL ─── */}
        <div className="w-full md:w-[45%] flex flex-col border-r border-white/[0.06] overflow-hidden">
          {/* Metadata Accordion */}
          <div className="border-b border-white/[0.06] shrink-0">
            <button onClick={() => setShowMeta(!showMeta)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-white/[0.02] transition-colors">
              <span className="text-text-secondary truncate">
                {meta.title || "Untitled Draft"} {meta.writer && `— ${meta.writer}`}
              </span>
              <svg className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${showMeta ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {showMeta && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                    {[
                      { key: "title", label: "Film Title", span: 2 },
                      { key: "writer", label: "Writer" },
                      { key: "director", label: "Director" },
                      { key: "production", label: "Production House" },
                      { key: "contact", label: "Contact" },
                      { key: "draft", label: "Draft No." },
                      { key: "date", label: "Date" },
                    ].map((f) => (
                      <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                        <label className="text-[10px] text-text-muted uppercase tracking-wider">{f.label}</label>
                        <input value={(meta as any)[f.key]}
                          onChange={(e) => setMeta({ ...meta, [f.key]: e.target.value })}
                          className="w-full h-9 bg-[#0D0D12] border border-white/[0.08] rounded-md px-3 text-sm text-white focus:outline-none focus:border-amber transition-colors mt-1" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Convert / Enhance Banner */}
          {bannerMode && rawText.length > 50 && (
            <div className="shrink-0">
              <ActionBanner
                mode={bannerMode}
                onAction={bannerMode === "convert" ? handleConvert : handleEnhance}
                loading={bannerMode === "convert" ? converting : enhancing}
                language={language}
                onLangChange={setLanguage}
              />
            </div>
          )}

          {/* Text Input */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <textarea value={rawText} onChange={(e) => handleTextChange(e.target.value)}
              placeholder={"Paste any script or story idea here…\n\nYou can paste:\n• A formatted screenplay\n• A rough story in plain paragraphs\n• Notes in any language (Hindi, Tamil, etc.)\n• A synopsis or treatment\n\nAI will convert it into proper screenplay format!"}
              spellCheck={false}
              className="w-full h-full bg-[#0D0D12] p-6 pl-14 font-mono text-[13px] text-text-secondary leading-[1.7] resize-none focus:outline-none overflow-y-auto scrollbar-hide" />
            <div className="absolute left-0 top-0 w-10 h-full overflow-hidden pointer-events-none">
              <div className="py-6 pr-2 text-right">
                {rawText.split("\n").map((_, i) => (
                  <div key={i} className="text-[11px] text-text-muted/40 leading-[1.7] font-mono">{i + 1}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Formatting Options */}
          <div className="border-t border-white/[0.06] px-5 py-4 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Formatting Options</h4>
            <Toggle label="Title Page" enabled={opts.titlePage} onChange={(v) => setOpts({ ...opts, titlePage: v })} />
            <Toggle label="Page Numbers" enabled={opts.pageNumbers} onChange={(v) => setOpts({ ...opts, pageNumbers: v })} />
            <Toggle label="Scene Numbers" enabled={opts.sceneNumbers} onChange={(v) => setOpts({ ...opts, sceneNumbers: v })} />
            <Toggle label="Watermark" enabled={opts.watermark} onChange={(v) => setOpts({ ...opts, watermark: v })} />
            {opts.watermark && (
              <input value={opts.watermarkText} onChange={(e) => setOpts({ ...opts, watermarkText: e.target.value })}
                className="w-full h-8 bg-[#0D0D12] border border-white/[0.08] rounded-md px-3 text-xs text-white focus:outline-none focus:border-amber mt-1"
                placeholder="DRAFT" />
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL — LIVE PREVIEW ─── */}
        <div className="hidden md:flex flex-1 flex-col bg-[#0A0A0F] overflow-y-auto scrollbar-hide items-center py-8 px-4">
          {!rawText.trim() ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <FilmStripIcon className="w-8 h-8 text-text-muted/30" />
                </div>
                <p className="text-text-muted text-sm">Paste a script to see the formatted preview</p>
                <p className="text-text-muted/50 text-xs mt-1">Industry-standard screenplay format</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[595px] space-y-8 pb-20">
              {/* Title Page */}
              {opts.titlePage && (
                <div className="bg-white rounded-sm shadow-2xl relative" style={{ height: 842, width: "100%", aspectRatio: "210/297" }}>
                  {opts.watermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-6xl font-bold text-black/[0.04] rotate-[-30deg] select-none tracking-widest font-mono">{opts.watermarkText}</span>
                    </div>
                  )}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full py-16 px-12">
                    <div className="flex-1" />
                    <h2 className="font-mono text-xl font-bold uppercase tracking-wide text-black text-center">{meta.title || "UNTITLED"}</h2>
                    {meta.writer && <p className="font-mono text-xs text-gray-600 mt-8 text-center">Written by</p>}
                    {meta.writer && <p className="font-mono text-sm text-black font-medium text-center mt-1">{meta.writer}</p>}
                    {meta.director && <p className="font-mono text-xs text-gray-600 mt-6 text-center">Directed by</p>}
                    {meta.director && <p className="font-mono text-sm text-black font-medium text-center mt-1">{meta.director}</p>}
                    <div className="flex-1" />
                    <div className="self-start mt-auto">
                      {meta.production && <p className="font-mono text-xs text-gray-700">{meta.production}</p>}
                      {meta.contact && <p className="font-mono text-xs text-gray-500 mt-1">{meta.contact}</p>}
                      {meta.draft && <p className="font-mono text-xs text-gray-500 mt-1">Draft {meta.draft} — {meta.date}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Script Pages */}
              {pages.map((pageLines, pageIdx) => {
                const actualPageNum = opts.titlePage ? pageIdx + 2 : pageIdx + 1;
                let localSceneIdx = 0;
                // We need to calculate scene index globally up to this page
                let globalSceneOffset = 0;
                for (let i = 0; i < pageIdx; i++) {
                  globalSceneOffset += pages[i].filter(l => l.type === "scene_heading").length;
                }

                return (
                  <div key={pageIdx} className="bg-white rounded-sm shadow-2xl relative overflow-hidden" style={{ minHeight: 842, width: "100%", aspectRatio: "210/297" }}>
                    {opts.watermark && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <span className="text-6xl font-bold text-black/[0.04] rotate-[-30deg] select-none tracking-widest font-mono">{opts.watermarkText}</span>
                      </div>
                    )}
                    {opts.pageNumbers && (
                      <div className="text-right pr-[72px] pt-[36px] text-[12px] text-black font-mono">{actualPageNum}.</div>
                    )}
                    <div className="relative z-10 pt-[36px] pb-[72px]">
                      {pageLines.map((line, i) => {
                        if (line.type === "blank") return <div key={i} className="h-[14px]" />;

                        if (line.type === "scene_heading") {
                          localSceneIdx++;
                          const currentSceneNum = globalSceneOffset + localSceneIdx;
                          return (
                            <div key={i} className="flex items-start mt-[14px] mb-[14px]" style={{ paddingLeft: "108px", paddingRight: "72px" }}>
                              {opts.sceneNumbers && <span className="text-[10px] font-mono text-gray-400 w-8 text-right mr-3 mt-[2px] shrink-0">{currentSceneNum}</span>}
                              <span className="font-mono text-[12px] font-bold text-black uppercase tracking-tight flex-1">{line.text}</span>
                              {opts.sceneNumbers && <span className="text-[10px] font-mono text-gray-400 w-8 text-left ml-3 mt-[2px] shrink-0">{currentSceneNum}</span>}
                            </div>
                          );
                        }

                        if (line.type === "character") {
                          return (
                            <div key={i} className="mt-[14px] mb-0" style={{ paddingLeft: "252px", paddingRight: "72px" }}>
                              <span className="font-mono text-[12px] font-bold uppercase text-black">{line.text}</span>
                            </div>
                          );
                        }

                        if (line.type === "parenthetical") {
                          return (
                            <div key={i} style={{ paddingLeft: "216px", paddingRight: "180px" }}>
                              <span className="font-mono text-[12px] text-black">({line.text.replace(/[()]/g, "")})</span>
                            </div>
                          );
                        }

                        if (line.type === "dialogue") {
                          return (
                            <div key={i} className="mb-0" style={{ paddingLeft: "180px", paddingRight: "144px" }}>
                              <span className="font-mono text-[12px] text-black leading-[1.2]">{line.text}</span>
                            </div>
                          );
                        }

                        if (line.type === "transition") {
                          return (
                            <div key={i} className="text-right mt-[14px] mb-[14px]" style={{ paddingRight: "72px" }}>
                              <span className="font-mono text-[12px] uppercase text-black">{line.text}</span>
                            </div>
                          );
                        }

                        return (
                          <div key={i} className="mb-0" style={{ paddingLeft: "108px", paddingRight: "72px" }}>
                            <span className="font-mono text-[12px] text-black leading-[1.2]">{line.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
