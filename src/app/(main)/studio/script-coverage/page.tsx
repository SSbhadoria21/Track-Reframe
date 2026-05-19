"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ApertureIcon } from "@/components/icons";
import { ScriptCoverageOutput } from "./ScriptCoverageOutput";
import toast from "react-hot-toast";

const SCRIPT_TYPES = [
  "Feature Film",
  "Short Film",
  "Web Series Episode",
  "Proof of Concept",
];

const COVERAGE_DEPTHS = [
  "Quick Read",
  "Standard Coverage",
  "Deep Analysis",
];

const FOCUS_AREAS = [
  "Story Structure",
  "Character Development",
  "Dialogue",
  "Pacing",
  "Theme & Subtext",
  "Commercial Viability",
  "Originality",
  "Scene Construction",
];

const LOADER_MESSAGES = [
  "Reading story structure...",
  "Analyzing character arcs...",
  "Evaluating dialogue...",
  "Checking pacing...",
  "Writing your coverage...",
];

export default function ScriptCoveragePage() {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [scriptText, setScriptText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "reading" | "ready">("idle");

  // Coverage settings
  const [scriptType, setScriptType] = useState("Feature Film");
  const [coverageDepth, setCoverageDepth] = useState("Standard Coverage");
  const [selectedFocus, setSelectedFocus] = useState<string[]>(FOCUS_AREAS);
  const [userConcerns, setUserConcerns] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [loaderMessageIdx, setLoaderMessageIdx] = useState(0);
  const [streamedText, setStreamedText] = useState("");
  const [progressVal, setProgressVal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab switch resets
  useEffect(() => {
    setScriptText("");
    setFileDetails(null);
    setOcrStatus("idle");
  }, [activeTab]);

  // Loading messages interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoaderMessageIdx((prev) => (prev + 1) % LOADER_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Progress bar animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isGenerating) {
      setProgressVal(5);
      progressInterval = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 800);
    } else {
      setProgressVal(0);
    }
    return () => clearInterval(progressInterval);
  }, [isGenerating]);

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isGenerating && scriptText.trim()) {
          handleGenerateCoverage();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scriptText, isGenerating, scriptType, coverageDepth, selectedFocus, userConcerns]);

  // PDF.js worker setup
  const loadPdfJs = () => {
    return new Promise<any>((resolve) => {
      if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjs);
      };
      document.head.appendChild(script);
    });
  };

  // PDF text extraction
  const extractTextFromPdf = async (file: File) => {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      text += pageText + "\n";
    }
    return text;
  };

  // OCR runner
  const handleOcr = async (file: File) => {
    setOcrStatus("reading");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/ai/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) throw new Error("OCR transcription failed");
        const data = await res.json();
        setScriptText(data.text);
        setOcrStatus("ready");
        toast.success("Handwriting transcription completed!");
      };
    } catch (err: any) {
      toast.error(err.message || "Failed to process handwriting image");
      setOcrStatus("idle");
    }
  };

  // File handler
  const handleFile = async (file: File) => {
    if (!file) return;
    const sizeStr = (file.size / 1024).toFixed(1) + " KB";
    setFileDetails({ name: file.name, size: sizeStr });
    setScriptTitle(file.name.substring(0, file.name.lastIndexOf(".")) || file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt") {
      const text = await file.text();
      setScriptText(text);
      setOcrStatus("ready");
    } else if (ext === "pdf") {
      try {
        toast.loading("Extracting PDF text...", { id: "pdf-load" });
        const text = await extractTextFromPdf(file);
        setScriptText(text);
        setOcrStatus("ready");
        toast.success("PDF script extracted successfully!", { id: "pdf-load" });
      } catch (err) {
        toast.error("Failed to parse PDF text", { id: "pdf-load" });
      }
    } else if (["jpg", "jpeg", "png"].includes(ext || "")) {
      handleOcr(file);
    } else {
      toast.error("Unsupported file format. Please upload .txt, .pdf, .jpg or .png");
    }
  };

  // Drag-and-drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Toggle checkboxes
  const handleFocusToggle = (area: string) => {
    if (selectedFocus.includes(area)) {
      setSelectedFocus(selectedFocus.filter((x) => x !== area));
    } else {
      setSelectedFocus([...selectedFocus, area]);
    }
  };

  // Execute coverage streaming
  const handleGenerateCoverage = async () => {
    if (!scriptText.trim()) {
      toast.error("Please add or paste script content first.");
      return;
    }

    setIsGenerating(true);
    setStreamedText("");

    try {
      const res = await fetch("/api/ai/script-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText,
          scriptType,
          coverageDepth,
          focusAreas: selectedFocus,
          userConcerns,
          scriptTitle: scriptTitle || "My Screenplay",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate coverage");
      }

      if (!res.body) throw new Error("Null response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.chunk) {
                setStreamedText((prev) => prev + data.chunk);
              }
            } catch {
              // Ignore parse errors on trailing chunks
            }
          }
        }
      }

      toast.success("Script coverage complete!");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during script analysis");
    } finally {
      setIsGenerating(false);
      setProgressVal(100);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-[800px] mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">
            Script Coverage
          </h1>
          <span className="px-3 py-1 rounded-full bg-indigo/15 border border-indigo/30 text-indigo text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo/5">
            ✦ AI Powered
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
          Get professional-grade coverage on your script. Story, character, pacing, dialogue — all analyzed.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-6">
        {/* Toggle tabs */}
        <div className="flex gap-4 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`pb-2 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === "upload" ? "text-amber" : "text-text-muted hover:text-white"
            }`}
          >
            Upload Script
            {activeTab === "upload" && (
              <motion.div
                layoutId="activeUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={`pb-2 text-sm font-semibold relative transition-colors cursor-pointer ${
              activeTab === "paste" ? "text-amber" : "text-text-muted hover:text-white"
            }`}
          >
            Paste Text
            {activeTab === "paste" && (
              <motion.div
                layoutId="activeUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber"
              />
            )}
          </button>
        </div>

        {/* Upload Zone */}
        {activeTab === "upload" ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
              isDragOver
                ? "border-amber bg-amber/[0.04] shadow-[0_0_20px_rgba(245,166,35,0.05)]"
                : "border-amber/30 hover:border-amber/60 bg-amber/[0.01]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              accept=".txt,.pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <ApertureIcon className="w-12 h-12 text-amber animate-[spin_6s_linear_infinite]" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-text-primary">
                Drop your script (.txt, .pdf, .fdx)
              </p>
              <p className="text-xs text-text-muted">or click to browse</p>
            </div>

            {/* Displaying File Status */}
            {fileDetails && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-white max-w-[200px] truncate">
                  {fileDetails.name} ({fileDetails.size})
                </span>
                {ocrStatus === "reading" ? (
                  <span className="px-2 py-0.5 rounded-full bg-indigo/10 border border-indigo/20 text-indigo text-[10px] font-bold animate-pulse">
                    Reading handwriting...
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    File loaded ✓
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Paste area */
          <div className="relative rounded-2xl border border-white/5 bg-[#0d0d12] overflow-hidden flex min-h-[300px]">
            {/* Left line numbers gutter */}
            <div className="w-10 bg-[#07070a] border-r border-white/5 py-4 flex flex-col items-end pr-2 text-right select-none text-[11px] font-mono text-text-muted space-y-[2.5px] leading-relaxed">
              {[...Array(Math.max(1, scriptText.split("\n").length))].map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste your screenplay or story here..."
              className="flex-1 bg-transparent py-4 px-4 text-xs font-mono text-white placeholder-text-muted focus:outline-none resize-y min-h-[300px] leading-relaxed select-text"
              style={{ caretColor: "#F5A623" }}
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-text-muted bg-surface/80 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm">
              Characters: {scriptText.length}
            </div>
          </div>
        )}

        {/* Coverage Settings Card */}
        <div className="rounded-2xl border border-white/5 bg-surface p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Coverage Settings
            </h3>
          </div>

          {/* Script Type pills */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase">
              Script Type
            </span>
            <div className="flex flex-wrap gap-2">
              {SCRIPT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setScriptType(type)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    scriptType === type
                      ? "bg-amber text-[#0a0a0f] border-amber"
                      : "bg-surface border-white/5 text-text-secondary hover:border-white/20 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Coverage depth radio cards */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase">
              Coverage Depth
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COVERAGE_DEPTHS.map((depth) => (
                <div
                  key={depth}
                  onClick={() => setCoverageDepth(depth)}
                  className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    coverageDepth === depth
                      ? "border-amber bg-amber/[0.02]"
                      : "border-white/5 bg-surface hover:border-white/10"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      coverageDepth === depth ? "text-amber" : "text-white"
                    }`}
                  >
                    {depth}
                  </span>
                  <span className="text-[10px] text-text-muted leading-relaxed">
                    {depth === "Quick Read"
                      ? "Core feedback only"
                      : depth === "Standard Coverage"
                      ? "Full analysis & grades"
                      : "Deep professional analysis"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas checkboxes */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase">
              Focus Areas
            </span>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => {
                const isSelected = selectedFocus.includes(area);
                return (
                  <button
                    key={area}
                    onClick={() => handleFocusToggle(area)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-amber text-surface border-amber"
                        : "bg-surface border-white/5 text-text-secondary hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User concerns */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase">
              What are you most worried about in this script?
            </span>
            <textarea
              value={userConcerns}
              onChange={(e) => setUserConcerns(e.target.value.slice(0, 200))}
              placeholder="e.g. I'm not sure the second act works, or the antagonist feels weak..."
              className="w-full h-20 bg-[#0d0d12] border border-white/5 rounded-xl p-3 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none resize-none"
            />
            <div className="text-right text-[10px] text-text-muted">
              {userConcerns.length}/200
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="space-y-4">
          <button
            onClick={handleGenerateCoverage}
            disabled={isGenerating || !scriptText.trim()}
            className="w-full h-14 rounded-xl bg-amber hover:bg-amber-hover disabled:bg-amber/50 disabled:cursor-not-allowed text-surface font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg shadow-amber/10 active:scale-[0.99] transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <ApertureIcon className="w-5 h-5 text-surface animate-spin" />
                <span>Analyzing your script...</span>
              </>
            ) : (
              <>
                <span>Generate Coverage →</span>
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-text-muted">
            Keyboard shortcut: <kbd className="bg-surface border border-white/10 px-1.5 py-0.5 rounded text-[9px]">Ctrl</kbd> + <kbd className="bg-surface border border-white/10 px-1.5 py-0.5 rounded text-[9px]">Enter</kbd>
          </p>

          {/* Spinning reel / Progress bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressVal}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center text-xs text-indigo animate-pulse font-semibold">
                {LOADER_MESSAGES[loaderMessageIdx]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Output Section */}
      <ScriptCoverageOutput
        streamedText={streamedText}
        isGenerating={isGenerating}
        scriptTitle={scriptTitle}
        scriptType={scriptType}
        focusAreas={selectedFocus}
        coverageDepth={coverageDepth}
      />
    </div>
  );
}
