"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

interface FestivalDetailPanelProps {
  festivalId: string | null;
  onClose: () => void;
  onStatusChange: () => void;
}

export function FestivalDetailPanel({
  festivalId,
  onClose,
  onStatusChange,
}: FestivalDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "eligibility" | "tips" | "winners" | "track">("overview");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // AI Synopsis generator state
  const [synopsisForm, setSynopsisForm] = useState({ title: "", logline: "", keywords: "" });
  const [synopsisOutput, setSynopsisOutput] = useState("");
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);

  // Eligibility Checkbox States
  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, boolean>>({});

  // Tracker State
  const [trackerForm, setTrackerForm] = useState({
    filmTitle: "",
    category: "",
    submissionDate: new Date().toISOString().split("T")[0],
    feePaidInr: 0,
    submissionReference: "",
    notes: "",
    notificationDate: "",
  });
  const [isSubmittingTracker, setIsSubmittingTracker] = useState(false);

  // Fetch full details
  useEffect(() => {
    if (!festivalId) return;
    setLoading(true);
    setActiveTab("overview");
    setSynopsisOutput("");
    setEligibilityChecks({});
    fetch(`/api/festivals/${festivalId}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        if (resData.submission) {
          setTrackerForm({
            filmTitle: resData.submission.film_title || "",
            category: resData.submission.category || "",
            submissionDate: resData.submission.submission_date || new Date().toISOString().split("T")[0],
            feePaidInr: resData.submission.fee_paid_inr || 0,
            submissionReference: resData.submission.submission_reference || "",
            notes: resData.submission.notes || "",
            notificationDate: resData.submission.notification_date || "",
          });
        } else {
          setTrackerForm({
            filmTitle: "",
            category: "",
            submissionDate: new Date().toISOString().split("T")[0],
            feePaidInr: 0,
            submissionReference: "",
            notes: "",
            notificationDate: "",
          });
        }
      })
      .catch(() => toast.error("Failed to load festival details"))
      .finally(() => setLoading(false));
  }, [festivalId]);

  if (!festivalId) return null;

  const handleGenerateSynopsis = async () => {
    if (!synopsisForm.title || !synopsisForm.logline) {
      toast.error("Please add Film Title and Logline.");
      return;
    }

    setIsGeneratingSynopsis(true);
    setSynopsisOutput("");

    try {
      const res = await fetch("/api/ai/festival-synopsis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmTitle: synopsisForm.title,
          logline: synopsisForm.logline,
          keywords: synopsisForm.keywords,
          festivalName: data.festival.name,
          festivalDesc: data.festival.description,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate synopsis");

      if (!res.body) throw new Error("Null response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        setSynopsisOutput((prev) => prev + chunk);
      }
      toast.success("Synopsis generated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingSynopsis(false);
    }
  };

  const handleSaveSynopsis = () => {
    navigator.clipboard.writeText(synopsisOutput);
    toast.success("Synopsis copied to clipboard!");
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTracker(true);
    try {
      const res = await fetch("/api/festivals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festivalId,
          ...trackerForm,
        }),
      });

      if (!res.ok) throw new Error("Failed to track submission");
      toast.success("Submission tracked successfully!");
      onStatusChange();
      // Reload details to update UI state
      const resData = await (await fetch(`/api/festivals/${festivalId}`)).json();
      setData(resData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmittingTracker(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!data.submission) return;
    try {
      const res = await fetch("/api/festivals/submit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: data.submission.id,
          status,
          resultDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      if (status === "selected") {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        toast.success("🎉 Congratulations! Selection recorded!");
      } else {
        toast.success("Status updated.");
      }

      onStatusChange();
      const resData = await (await fetch(`/api/festivals/${festivalId}`)).json();
      setData(resData);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Eligibility Evaluator
  const evalEligibility = () => {
    const checks = Object.values(eligibilityChecks);
    const checkedCount = checks.filter(Boolean).length;
    if (checkedCount === 0) return { verdict: "Unchecked", color: "text-text-muted", note: "Tick the requirements checklist to evaluate eligibility." };
    if (checkedCount === 7) return { verdict: "Yes", color: "text-emerald-400", note: "Your film meets all standard requirements for this festival!" };
    if (checkedCount >= 5) return { verdict: "Probably", color: "text-amber", note: "You meet most requirements. Confirm any unchecked restrictions." };
    return { verdict: "No/Risky", color: "text-red-400", note: "Your film fails multiple key requirements. Read guidelines carefully." };
  };

  const eligibilityResult = evalEligibility();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-[#111118] border-l border-white/5 z-50 flex flex-col shadow-2xl overflow-y-auto"
    >
      {loading || !data ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber/30 border-t-amber animate-spin" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-start gap-4">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-2xl font-bold font-display text-amber">
                {data.festival.logo_url ? (
                  <img src={data.festival.logo_url} alt={data.festival.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  data.festival.name.charAt(0)
                )}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white leading-snug">
                  {data.festival.name}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  📍 {data.festival.city}, {data.festival.country}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white text-xl font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 overflow-x-auto divide-x divide-white/5 text-center shrink-0">
            {["overview", "eligibility", "tips", "winners", "track"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-w-[70px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab ? "bg-amber/5 text-amber" : "text-text-muted hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable Contents */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 select-text">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold">
                    About the Festival
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {data.festival.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[9px] text-text-muted font-mono uppercase block">Established</span>
                    <span className="text-xs text-white font-bold">{data.festival.established_year || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted font-mono uppercase block">Format</span>
                    <span className="text-xs text-white font-bold">{data.festival.festival_type || "Hybrid / Physical"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted font-mono uppercase block">Submission Platform</span>
                    <span className="text-xs text-white font-bold">{data.festival.submission_platform || "Direct"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted font-mono uppercase block">Website</span>
                    <a
                      href={data.festival.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber font-bold hover:underline"
                    >
                      Visit Site ↗
                    </a>
                  </div>
                </div>

                {/* Deadlines list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold">
                    Deadlines & Entry Fees
                  </span>
                  <div className="space-y-2.5 divide-y divide-white/5">
                    {data.festival.festival_deadlines?.map((d: any) => (
                      <div key={d.id} className="pt-2.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white capitalize">{d.deadline_type}</span>
                          <p className="text-[10px] text-text-muted">
                            {new Date(d.deadline_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-mono text-amber font-bold">
                          {d.is_free ? "Free" : d.fee_inr ? `₹${d.fee_inr}` : `$${d.fee_usd}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Eligibility Tab */}
            {activeTab === "eligibility" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold">
                    Eligibility Checklist
                  </span>
                  <p className="text-xs text-text-secondary">
                    Check which requirements your film meets to verify submission eligibility.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    "Completion Date: Film finished after Jan 2024",
                    "Runtime: Short film (under 30 mins) or Feature (under 120 mins)",
                    "Subtitles: English subtitles available",
                    "Premiere Status: Meets previous screening restrictions",
                    "Geographic: Meets regional or filmmaker origin guidelines",
                    "File Formats: DCP, ProRes, or high-res file available",
                    "Rights & Releases: All music & actor releases signed",
                  ].map((req, idx) => (
                    <label key={idx} className="flex items-start gap-3 text-xs text-text-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!eligibilityChecks[idx]}
                        onChange={(e) => setEligibilityChecks({ ...eligibilityChecks, [idx]: e.target.checked })}
                        className="mt-0.5 rounded border-white/10 text-amber accent-amber"
                      />
                      <span>{req}</span>
                    </label>
                  ))}
                </div>

                {/* Quick Check Verdict Widget */}
                <div className="bg-surface p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Eligible?</span>
                    <span className={`text-xs font-extrabold uppercase ${eligibilityResult.color}`}>
                      {eligibilityResult.verdict}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {eligibilityResult.note}
                  </p>
                </div>
              </div>
            )}

            {/* Submission Tips Tab */}
            {activeTab === "tips" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold">
                    What they look for
                  </span>
                  <ul className="space-y-2 text-xs text-text-secondary leading-relaxed list-disc pl-4">
                    <li>Unique cinematic voices and visually bold storytelling.</li>
                    <li>Strong emotional impact or deep social/philosophical undertones.</li>
                    <li>Professional standard production values, lighting, sound design, and pacing.</li>
                  </ul>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-indigo uppercase font-bold">
                      AI Synopsis Optimizer
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo/10 text-indigo text-[8px] font-bold">
                      ✦ Gemini
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Generate a tailored, 100-word synopsis optimized specifically for this festival's tone and focus.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Film Title"
                      value={synopsisForm.title}
                      onChange={(e) => setSynopsisForm({ ...synopsisForm, title: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none"
                    />
                    <textarea
                      placeholder="Film Logline"
                      value={synopsisForm.logline}
                      onChange={(e) => setSynopsisForm({ ...synopsisForm, logline: e.target.value })}
                      className="w-full h-16 bg-[#0d0d12] border border-white/5 rounded-lg p-3 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none resize-none"
                    />
                    <input
                      type="text"
                      placeholder="Keywords (e.g., identity, family, memory, thriller)"
                      value={synopsisForm.keywords}
                      onChange={(e) => setSynopsisForm({ ...synopsisForm, keywords: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none"
                    />
                    <button
                      onClick={handleGenerateSynopsis}
                      disabled={isGeneratingSynopsis}
                      className="w-full h-10 rounded-lg bg-indigo hover:bg-indigo-hover disabled:bg-indigo/50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      {isGeneratingSynopsis ? "Generating..." : "✦ Generate tailored synopsis"}
                    </button>
                  </div>

                  {synopsisOutput && (
                    <div className="bg-[#0d0d12] p-4 rounded-xl border border-indigo/20 space-y-3">
                      <p className="font-mono text-xs text-text-primary italic leading-relaxed whitespace-pre-wrap">
                        {synopsisOutput}
                      </p>
                      <button
                        onClick={handleSaveSynopsis}
                        className="w-full h-9 rounded-lg border border-white/10 hover:border-amber/30 text-xs font-semibold text-text-secondary hover:text-white flex items-center justify-center gap-1 hover:bg-white/[0.02]"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Past Winners Tab */}
            {activeTab === "winners" && (
              <div className="space-y-6">
                <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold">
                  Past Winners
                </span>

                {data.festival.festival_winners?.length > 0 ? (
                  <div className="space-y-3">
                    {data.festival.festival_winners.map((w: any) => (
                      <div key={w.id} className="bg-surface p-4 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex justify-between items-start gap-3">
                          <h4 className="text-xs font-bold text-white">{w.film_title}</h4>
                          <span className="text-[10px] font-mono text-amber font-semibold">
                            {w.edition_year}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary">
                          Director: {w.director_name} ({w.country})
                        </p>
                        <p className="text-[10px] text-text-muted italic">
                          Award: {w.award_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-text-muted">
                      No winner data loaded for this festival yet.
                    </p>
                    <button
                      onClick={() => toast.loading("Winners form coming soon!", { duration: 2000 })}
                      className="text-xs font-bold text-amber hover:underline cursor-pointer"
                    >
                      Help us add past winners →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Track My Entry Tab */}
            {activeTab === "track" && (
              <div className="space-y-6">
                {data.submission ? (
                  /* Submission Timeline */
                  <div className="space-y-6">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold">
                      Submission Timeline
                    </span>

                    <div className="relative border-l border-white/10 pl-6 ml-3 space-y-8 py-2">
                      {/* Step 1: Submitted */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border border-[#111118]" />
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white">Submitted</span>
                          <p className="text-[10px] text-text-muted">
                            Submitted on {new Date(data.submission.submission_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Step 2: Awaiting / Status */}
                      <div className="relative">
                        <div
                          className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border border-[#111118] ${
                            data.submission.status === "submitted"
                              ? "bg-amber"
                              : ["selected", "waitlisted"].includes(data.submission.status)
                              ? "bg-emerald-500"
                              : "bg-red-400"
                          }`}
                        />
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white capitalize">
                            Status: {data.submission.status}
                          </span>
                          <p className="text-[10px] text-text-muted">
                            Notification Period: Sometime in 2026.
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Result */}
                      <div className="relative">
                        <div
                          className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border border-[#111118] ${
                            data.submission.result_date ? "bg-emerald-500" : "bg-white/10"
                          }`}
                        />
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white">Result Received</span>
                          <p className="text-[10px] text-text-muted">
                            {data.submission.result_date
                              ? `Confirmed on ${new Date(data.submission.result_date).toLocaleDateString()}`
                              : "Awaiting festival announcements."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Change Status Buttons */}
                    <div className="space-y-2.5 pt-4 border-t border-white/5">
                      <span className="text-[10px] font-mono tracking-[0.2em] text-text-muted uppercase font-bold block">
                        Update Submission Status
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus("selected")}
                          className="flex-1 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold active:scale-95 cursor-pointer"
                        >
                          Selected ✓
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("waitlisted")}
                          className="flex-1 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold active:scale-95 cursor-pointer"
                        >
                          Waitlisted
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("not_selected")}
                          className="flex-1 h-9 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold active:scale-95 cursor-pointer"
                        >
                          Not Selected
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Submission Tracker Form */
                  <form onSubmit={handleTrackSubmit} className="space-y-4">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-amber uppercase font-bold block">
                      Mark as Submitted
                    </span>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                          Film Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. My Film Title"
                          value={trackerForm.filmTitle}
                          onChange={(e) => setTrackerForm({ ...trackerForm, filmTitle: e.target.value })}
                          className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                          Category Submitted To
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. International Shorts"
                          value={trackerForm.category}
                          onChange={(e) => setTrackerForm({ ...trackerForm, category: e.target.value })}
                          className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                            Submission Date
                          </label>
                          <input
                            type="date"
                            value={trackerForm.submissionDate}
                            onChange={(e) => setTrackerForm({ ...trackerForm, submissionDate: e.target.value })}
                            className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                            Fee Paid (INR)
                          </label>
                          <input
                            type="number"
                            value={trackerForm.feePaidInr}
                            onChange={(e) => setTrackerForm({ ...trackerForm, feePaidInr: parseInt(e.target.value) || 0 })}
                            className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                          Submission Reference ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. FFW-12948-2026"
                          value={trackerForm.submissionReference}
                          onChange={(e) => setTrackerForm({ ...trackerForm, submissionReference: e.target.value })}
                          className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                          Notes / Reminders
                        </label>
                        <textarea
                          placeholder="Optional notes or reminders..."
                          value={trackerForm.notes}
                          onChange={(e) => setTrackerForm({ ...trackerForm, notes: e.target.value })}
                          className="w-full h-20 bg-[#0d0d12] border border-white/5 rounded-lg p-3 text-xs text-white focus:border-amber/50 outline-none resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTracker}
                        className="w-full h-11 rounded-lg bg-amber hover:bg-amber-hover text-surface text-xs font-bold active:scale-95 cursor-pointer transition-all flex items-center justify-center"
                      >
                        {isSubmittingTracker ? "Tracking..." : "Mark as Submitted"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
