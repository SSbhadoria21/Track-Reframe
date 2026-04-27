"use client";
import { FilmReelIcon } from "@/components/icons";

export default function CallSheetPage() {
  return (
    <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <FilmReelIcon className="w-6 h-6 text-amber" />
        <h1 className="font-display text-3xl font-bold">Call Sheet Generator</h1>
      </div>
      <p className="text-text-secondary mb-10">Generate professional call sheets for your shoot days.</p>
      <div className="h-64 rounded-xl border border-dashed border-amber/30 bg-amber/[0.02] flex flex-col items-center justify-center gap-4">
        <FilmReelIcon className="w-16 h-16 text-amber/30" />
        <span className="text-sm text-text-muted">Coming soon</span>
      </div>
    </div>
  );
}
