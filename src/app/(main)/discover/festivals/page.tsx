"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FestivalCard } from "@/components/festivals/FestivalCard";
import { FestivalDetailPanel } from "@/components/festivals/FestivalDetailPanel";
import { SubmissionTracker } from "@/components/festivals/SubmissionTracker";
import toast from "react-hot-toast";

const FILM_TYPES = ["Short Film", "Feature Film", "Documentary", "Animation", "Web Series Pilot", "Experimental"];
const CATEGORIES = ["Student Film", "First Feature", "International", "Regional Language", "Women Filmmaker", "LGBTQ+ Theme", "Social Issue"];
const PRESTIGE_LEVELS = ["Oscar Qualifying", "BAFTA Qualifying", "Tier 1", "Tier 2", "Emerging Festivals"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Bengali", "Marathi"];

export default function DiscoverFestivalsPage() {
  const [activeView, setActiveView] = useState<"grid" | "tracker">("grid");
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedFilmTypes, setSelectedFilmTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetTier, setBudgetTier] = useState<string>("Any");
  const [maxFee, setMaxFee] = useState<number>(3000);
  const [freeOnly, setFreeOnly] = useState<boolean>(false);
  const [deadlineRange, setDeadlineRange] = useState<string>("All");
  const [selectedPrestige, setSelectedPrestige] = useState<string[]>([]);
  const [region, setRegion] = useState<string>("Both");
  const [language, setLanguage] = useState<string>("Any");

  // User relations (saved & submitted)
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  // Fetch saved & submitted lists
  useEffect(() => {
    // We can extract saved list or query relations
    fetch("/api/festivals/submit")
      .then((res) => res.json())
      .then((data) => {
        const ids = data.submissions?.map((s: any) => s.festival_id) || [];
        setSubmittedIds(ids);
      })
      .catch(() => {});
  }, [refreshTrigger]);

  // Fetch filtered festivals
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedFilmTypes.length > 0) params.append("filmTypes", selectedFilmTypes.join(","));
    if (selectedCategories.length > 0) params.append("categories", selectedCategories.join(","));
    if (selectedPrestige.length > 0) params.append("prestige", selectedPrestige.join(","));
    params.append("region", region);
    params.append("freeOnly", String(freeOnly));
    if (!freeOnly) params.append("maxFee", String(maxFee));
    params.append("deadline", deadlineRange);
    params.append("language", language);

    fetch(`/api/festivals?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setFestivals(data.festivals || []);
      })
      .catch(() => toast.error("Failed to load festivals catalog"))
      .finally(() => setLoading(false));
  }, [
    search,
    selectedFilmTypes,
    selectedCategories,
    budgetTier,
    maxFee,
    freeOnly,
    deadlineRange,
    selectedPrestige,
    region,
    language,
    refreshTrigger,
  ]);

  const handleToggleSave = async (festivalId: string, isCurrentlySaved: boolean) => {
    try {
      const res = await fetch("/api/festivals/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festivalId,
          action: isCurrentlySaved ? "unsave" : "save",
        }),
      });

      if (!res.ok) throw new Error();
      if (isCurrentlySaved) {
        setSavedIds(savedIds.filter((id) => id !== festivalId));
        toast.success("Bookmark removed");
      } else {
        setSavedIds([...savedIds, festivalId]);
        toast.success("Festival bookmarked!");
      }
      setRefreshTrigger((p) => p + 1);
    } catch {
      toast.error("Failed to update bookmark status");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedFilmTypes([]);
    setSelectedCategories([]);
    setBudgetTier("Any");
    setMaxFee(3000);
    setFreeOnly(false);
    setDeadlineRange("All");
    setSelectedPrestige([]);
    setRegion("Both");
    setLanguage("Any");
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen relative">
      {/* Left Filters Sidebar */}
      <aside className="w-full md:w-[280px] shrink-0 bg-[#111118] border-r border-white/5 p-6 space-y-6 md:sticky md:top-0 md:h-screen overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white">Filters</h3>
          <button
            onClick={handleClearFilters}
            className="text-[10px] text-amber font-bold hover:underline cursor-pointer"
          >
            Clear all
          </button>
        </div>

        {/* Region Selector */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted font-mono uppercase block">Region</span>
          <div className="flex bg-[#0d0d12] rounded-lg p-1 border border-white/5">
            {["India", "International", "Both"].map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                  region === r ? "bg-amber text-[#0a0a0f]" : "text-text-muted hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Film Type Checkboxes */}
        <div className="space-y-2.5">
          <span className="text-[10px] text-text-muted font-mono uppercase block">Film Type</span>
          <div className="space-y-2">
            {FILM_TYPES.map((type) => {
              const checked = selectedFilmTypes.includes(type);
              return (
                <label key={type} className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedFilmTypes(
                        checked ? selectedFilmTypes.filter((x) => x !== type) : [...selectedFilmTypes, type]
                      )
                    }
                    className="rounded border-white/10 text-amber accent-amber"
                  />
                  <span>{type}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Categories Checkboxes */}
        <div className="space-y-2.5">
          <span className="text-[10px] text-text-muted font-mono uppercase block">Theme / Category</span>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const checked = selectedCategories.includes(cat);
              return (
                <label key={cat} className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedCategories(
                        checked ? selectedCategories.filter((x) => x !== cat) : [...selectedCategories, cat]
                      )
                    }
                    className="rounded border-white/10 text-amber accent-amber"
                  />
                  <span>{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submission Fee Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] text-text-muted font-mono uppercase">
            <span>Entry Fee</span>
            <span>{freeOnly ? "Free" : `Up to ₹${maxFee}`}</span>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded border-white/10 text-amber accent-amber"
            />
            <span>Free submissions only</span>
          </label>

          {!freeOnly && (
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={maxFee}
              onChange={(e) => setMaxFee(parseInt(e.target.value))}
              className="w-full accent-amber bg-white/5 rounded-lg appearance-none h-1 cursor-pointer"
            />
          )}
        </div>

        {/* Deadline Range Pills */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted font-mono uppercase block">Deadline Range</span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Next 30 Days", val: "30days" },
              { label: "Next 3 Months", val: "3months" },
              { label: "Next 6 Months", val: "6months" },
              { label: "All Upcoming", val: "All" },
            ].map((d) => (
              <button
                key={d.val}
                onClick={() => setDeadlineRange(d.val)}
                className={`py-1.5 px-2 rounded-md text-[9px] font-bold border transition-all cursor-pointer ${
                  deadlineRange === d.val
                    ? "bg-amber text-[#0a0a0f] border-amber"
                    : "bg-[#0d0d12] border-white/5 text-text-muted hover:border-white/10"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prestige Level */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted font-mono uppercase block">Prestige</span>
          <div className="flex flex-col gap-1.5">
            {PRESTIGE_LEVELS.map((level) => {
              const checked = selectedPrestige.includes(level);
              return (
                <button
                  key={level}
                  onClick={() =>
                    setSelectedPrestige(
                      checked ? selectedPrestige.filter((x) => x !== level) : [...selectedPrestige, level]
                    )
                  }
                  className={`py-2 px-3 rounded-lg text-[10px] font-bold border text-left transition-all flex items-center justify-between cursor-pointer ${
                    checked
                      ? "bg-amber text-[#0a0a0f] border-amber"
                      : "bg-[#0d0d12] border-white/5 text-text-muted hover:border-white/10"
                  }`}
                >
                  <span>{level}</span>
                  {checked && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language restrictions */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted font-mono uppercase block">Language Restrictions</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none cursor-pointer"
          >
            <option value="Any">Any Language</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h1 className="font-display text-3xl md:text-[38px] font-bold text-white tracking-tight">
                Festival Intelligence
              </h1>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
              Find the right festivals for your film. Track deadlines. Build your submission package.
            </p>
          </div>

          {/* View Toggles */}
          <div className="flex bg-[#111118] border border-white/5 rounded-lg p-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveView("grid")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeView === "grid" ? "bg-amber text-[#0a0a0f]" : "text-text-secondary hover:text-white"
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveView("tracker")}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeView === "tracker" ? "bg-amber text-[#0a0a0f]" : "text-text-secondary hover:text-white"
              }`}
            >
              My Tracker
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 text-xs text-text-muted border-y border-white/5 py-3 select-none flex-wrap">
          <span className="font-semibold text-white">340+ Festivals</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span>Updated Weekly</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span>India-focused + Global</span>
        </div>

        {activeView === "grid" ? (
          <div className="space-y-6">
            {/* Search Input */}
            <div className="max-w-md relative">
              <input
                type="text"
                placeholder="Search festivals by name, city, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 bg-surface border border-white/5 rounded-xl pl-10 pr-4 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none"
              />
              <span className="absolute left-3.5 top-3.5 text-text-muted text-sm">🔍</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[290px] rounded-2xl bg-surface border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : festivals.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-2xl border border-white/5 space-y-2">
                <p className="text-sm text-text-secondary font-bold">No festivals matched your filters.</p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Try broadening your search or clicking "Clear all" in the sidebar to reset filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {festivals.map((festival) => {
                  const isSaved = savedIds.includes(festival.id) || festival.saved_festivals?.length > 0;
                  const isSubmitted = submittedIds.includes(festival.id);
                  return (
                    <FestivalCard
                      key={festival.id}
                      festival={festival}
                      onViewDetails={() => setSelectedFestivalId(festival.id)}
                      onToggleSave={() => handleToggleSave(festival.id, isSaved)}
                      isSaved={isSaved}
                      isSubmitted={isSubmitted}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <SubmissionTracker
            onSelectFestival={(id) => setSelectedFestivalId(id)}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Slide-out details panel overlay */}
      <AnimatePresence>
        {selectedFestivalId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFestivalId(null)}
              className="fixed inset-0 bg-[#0a0a0f] z-40 cursor-pointer"
            />
            <FestivalDetailPanel
              festivalId={selectedFestivalId}
              onClose={() => setSelectedFestivalId(null)}
              onStatusChange={() => setRefreshTrigger((p) => p + 1)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
