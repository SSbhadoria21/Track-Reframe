"use client";
import { ApertureIcon } from "@/components/icons";

export default function DirectorAnalyzerPage() {
  return (
    <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ApertureIcon className="w-6 h-6 text-amber" />
        <h1 className="font-display text-3xl font-bold">Director Style Analyzer</h1>
      </div>
      <p className="text-text-secondary mb-10">Analyze any director&apos;s signature techniques and visual language.</p>
      <div className="h-64 rounded-xl border border-dashed border-amber/30 bg-amber/[0.02] flex flex-col items-center justify-center gap-4">
        <ApertureIcon className="w-16 h-16 text-amber/30" />
        <span className="text-sm text-text-muted">Coming soon</span>
      </div>
    </div>
  );
}
