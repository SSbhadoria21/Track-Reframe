"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Script {
  id: string;
  title: string;
  raw_text: string;
  formatted_text: string;
  word_count: number;
  director_name: string;
  tool_used: string;
  genre_tags: string[];
  created_at: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-white/10", text: "text-text-muted", label: "Draft" },
  continuity_ai: { bg: "bg-indigo/10", text: "text-indigo", label: "AI Generated" },
  formatter: { bg: "bg-amber/10", text: "text-amber", label: "Formatted" },
};

export function ScriptsTab({ userId, isOwner = true }: { userId?: string, isOwner?: boolean }) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const url = userId ? `/api/scripts?user_id=${userId}` : "/api/scripts";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setScripts(data.scripts || []);
        }
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    };
    fetchScripts();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <h3 className="font-display font-bold text-lg text-white mb-1">No Scripts Yet</h3>
        <p className="text-sm text-text-muted max-w-sm mb-4">
          Scripts you generate with the AI Continuity tool or save from the Script Formatter will appear here.
        </p>
        {isOwner && (
          <Link
            href="/studio/script-continuity"
            className="px-5 py-2.5 bg-amber text-[#0A0A0F] font-bold rounded-lg text-sm hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Open Script Continuity AI →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {scripts.map((script, i) => {
        const status = statusConfig[script.tool_used] || statusConfig.draft;
        const preview = script.formatted_text?.substring(0, 200) || script.raw_text?.substring(0, 200) || "";
        const pages = Math.max(1, Math.ceil((script.word_count || 0) / 250));
        const timeAgo = getTimeAgo(script.created_at);

        return (
          <motion.div
            key={script.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="group bg-elevated border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-all duration-200 cursor-pointer"
          >
            <div className="flex flex-col md:flex-row">
              {/* Script preview panel */}
              <div className="md:w-[280px] shrink-0 bg-[#0D0D12] p-4 border-r border-white/5 relative overflow-hidden">
                <pre
                  className="text-[11px] leading-relaxed text-text-muted whitespace-pre-wrap"
                  style={{ fontFamily: '"Courier New", Courier, monospace' }}
                >
                  {preview}
                </pre>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0D0D12] to-transparent" />
              </div>

              {/* Info panel */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-base text-white group-hover:text-amber transition-colors">
                      {script.title}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${status.bg} ${status.text} border border-current/20`}>
                      {status.label}
                    </span>
                  </div>
                  {script.director_name && (
                    <span className="text-xs text-text-secondary">Style: {script.director_name}</span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      ~{pages} pages
                    </span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {timeAgo}
                    </span>
                    <span className="text-[10px] text-text-muted">{script.word_count} words</span>
                  </div>

                  {/* Genre tags */}
                  <div className="flex items-center gap-1.5">
                    {(script.genre_tags || []).map((tag) => (
                      <span key={tag} className="text-[9px] font-medium px-2 py-0.5 rounded bg-indigo/10 text-indigo border border-indigo/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
