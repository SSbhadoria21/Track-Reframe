"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApertureIcon, CameraIcon, FilmReelIcon } from "@/components/icons";

/* ─── Data ─── */
const TABS = ["All Films", "New Creators", "Director Style", "By Era", "Mood", "Bucket Lists", "Crew", "Film DNA"];

const MOODS = [
  { name: "Melancholic", emoji: "🌧️", color: "from-blue-900/40 to-indigo-900/40" },
  { name: "Thrilling", emoji: "⚡", color: "from-red-900/40 to-orange-900/40" },
  { name: "Romantic", emoji: "🌹", color: "from-pink-900/40 to-rose-900/40" },
  { name: "Inspiring", emoji: "✨", color: "from-amber-900/40 to-yellow-900/40" },
  { name: "Eerie", emoji: "🌑", color: "from-slate-900/40 to-gray-900/40" },
  { name: "Nostalgic", emoji: "📷", color: "from-orange-900/40 to-amber-900/40" },
  { name: "Psychedelic", emoji: "🌀", color: "from-purple-900/40 to-pink-900/40" },
  { name: "Hopeful", emoji: "🌅", color: "from-cyan-900/40 to-teal-900/40" },
  { name: "Dark Comedy", emoji: "🎭", color: "from-emerald-900/40 to-green-900/40" },
  { name: "Surreal", emoji: "🪞", color: "from-violet-900/40 to-fuchsia-900/40" },
  { name: "Gritty", emoji: "🏚️", color: "from-stone-900/40 to-neutral-900/40" },
  { name: "Whimsical", emoji: "🎪", color: "from-sky-900/40 to-blue-900/40" },
];

const MOCK_FILMS = [
  { title: "Neon Blood", director: "Anurag K.", genres: ["Neo-Noir", "Crime"], rating: 9.4, initials: "AK" },
  { title: "Shadows in Room 4B", director: "Samir R.", genres: ["Noir", "Short"], rating: 8.7, initials: "SR" },
  { title: "The Last Frame", director: "Maya W.", genres: ["Drama", "Indie"], rating: 9.1, initials: "MW" },
  { title: "Mumbai Rain", director: "Zoya A.", genres: ["Romance", "Drama"], rating: 8.9, initials: "ZA" },
  { title: "Concrete Dreams", director: "Vishal B.", genres: ["Thriller"], rating: 8.2, initials: "VB" },
  { title: "Golden Hour", director: "Priya M.", genres: ["Documentary", "Short"], rating: 9.0, initials: "PM" },
  { title: "Dust & Echoes", director: "Arjun D.", genres: ["Western", "Drama"], rating: 8.5, initials: "AD" },
  { title: "Paper Walls", director: "Kavya S.", genres: ["Drama", "Indie"], rating: 8.8, initials: "KS" },
  { title: "Reel Life", director: "Anurag K.", genres: ["Meta", "Comedy"], rating: 7.9, initials: "AK" },
];

const MOCK_CREATORS = [
  { name: "Anurag Kashyap", role: "Director", initials: "AK", films: 4, followers: 12400 },
  { name: "Zoya Akhtar", role: "Director", initials: "ZA", films: 3, followers: 9800 },
  { name: "Roger Deakins", role: "Cinematographer", initials: "RD", films: 1, followers: 7200 },
  { name: "Maya Woods", role: "Writer", initials: "MW", films: 2, followers: 3400 },
  { name: "Samir Raj", role: "Cinematographer", initials: "SR", films: 5, followers: 5100 },
  { name: "Hans Zimmer", role: "Composer", initials: "HZ", films: 0, followers: 15600 },
];

const ERAS = [
  { name: "Golden Age", years: "1940–1960", color: "text-amber" },
  { name: "New Wave", years: "1960–1980", color: "text-cyan-400" },
  { name: "Blockbuster Era", years: "1980–2000", color: "text-red-400" },
  { name: "Digital Revolution", years: "2000–2015", color: "text-indigo" },
  { name: "Streaming Age", years: "2015–Present", color: "text-emerald-400" },
];

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto overflow-y-auto scrollbar-hide pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-[40px] font-bold mb-2">Discover</h1>
        <p className="text-text-secondary">Find films, creators, and inspiration across the platform.</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search films, creators, genres, moods..."
          className="w-full h-12 bg-surface border border-white/[0.08] rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-amber transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-8 pb-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === i
                ? "bg-amber text-[#0A0A0F]"
                : "text-text-secondary hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* ALL FILMS */}
          {activeTab === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MOCK_FILMS.map((film) => (
                <div key={film.title} className="group bg-surface border border-white/[0.06] rounded-xl overflow-hidden cursor-pointer hover:border-amber/30 transition-all">
                  {/* Poster placeholder */}
                  <div className="h-40 bg-gradient-to-br from-elevated to-[#0D0D12] flex items-center justify-center relative overflow-hidden">
                    <FilmReelIcon className="w-12 h-12 text-white/[0.06]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold text-amber">View Film →</span>
                    </div>
                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber fill-amber" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                      <span className="text-xs font-bold text-amber">{film.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 group-hover:text-amber transition-colors">{film.title}</h3>
                    <p className="text-xs text-text-muted mb-2">by {film.director}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {film.genres.map((g) => (
                        <span key={g} className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NEW CREATORS */}
          {activeTab === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MOCK_CREATORS.map((c) => (
                <div key={c.name} className="group bg-surface border border-white/[0.06] rounded-xl p-5 cursor-pointer hover:border-amber/30 transition-all flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo/20 border-2 border-indigo/40 flex items-center justify-center text-indigo font-bold text-xl mb-3">
                    {c.initials}
                  </div>
                  <h3 className="font-bold text-sm group-hover:text-amber transition-colors">{c.name}</h3>
                  <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full bg-white/5 border border-white/5 mt-1">{c.role}</span>
                  <div className="flex gap-6 mt-4">
                    <div className="text-center">
                      <span className="text-sm font-bold">{c.films}</span>
                      <span className="text-[10px] text-text-muted block">Films</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold">{(c.followers / 1000).toFixed(1)}k</span>
                      <span className="text-[10px] text-text-muted block">Followers</span>
                    </div>
                  </div>
                  <button className="mt-4 px-5 py-2 rounded-full border border-amber/30 text-amber text-xs font-bold hover:bg-amber/10 transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* DIRECTOR STYLE */}
          {activeTab === 2 && (
            <div className="text-center py-16">
              <ApertureIcon className="w-16 h-16 text-white/[0.06] mx-auto mb-4" />
              <p className="text-text-muted">Director Style cards coming soon — 30 directors with side panel.</p>
            </div>
          )}

          {/* BY ERA */}
          {activeTab === 3 && (
            <div className="flex flex-col gap-4">
              {ERAS.map((era) => (
                <div key={era.name} className="group bg-surface border border-white/[0.06] rounded-xl p-6 cursor-pointer hover:border-amber/30 transition-all flex items-center gap-6">
                  <span className={`font-display text-3xl font-bold ${era.color}`}>{era.years.split("–")[0]}</span>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-amber transition-colors">{era.name}</h3>
                    <span className="text-xs text-text-muted">{era.years}</span>
                  </div>
                  <span className="ml-auto text-text-muted group-hover:text-amber transition-colors text-lg">→</span>
                </div>
              ))}
            </div>
          )}

          {/* MOOD */}
          {activeTab === 4 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {MOODS.map((mood) => (
                <div
                  key={mood.name}
                  className={`group hex-clip aspect-square bg-gradient-to-br ${mood.color} border border-white/[0.06] flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform`}
                >
                  <span className="text-4xl mb-2">{mood.emoji}</span>
                  <span className="text-sm font-bold">{mood.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* BUCKET LISTS */}
          {activeTab === 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { name: "Top 50 Indian Indie Films", count: 50, completed: 12 },
                { name: "Noir Essentials", count: 25, completed: 8 },
                { name: "Must-Watch Shorts Under 5 Min", count: 30, completed: 5 },
                { name: "Award-Winning Debut Films", count: 20, completed: 3 },
              ].map((list) => (
                <div key={list.name} className="bg-surface border border-white/[0.06] rounded-xl p-6 cursor-pointer hover:border-amber/30 transition-all">
                  <h3 className="font-bold mb-2">{list.name}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber rounded-full" style={{ width: `${(list.completed / list.count) * 100}%` }} />
                    </div>
                    <span className="text-xs text-text-muted">{list.completed}/{list.count}</span>
                  </div>
                  <span className="text-xs text-amber font-medium">Continue watching →</span>
                </div>
              ))}
            </div>
          )}

          {/* CREW */}
          {activeTab === 6 && (
            <div className="text-center py-16">
              <CameraIcon className="w-16 h-16 text-white/[0.06] mx-auto mb-4" />
              <p className="text-text-muted">Crew Discovery page coming soon.</p>
            </div>
          )}

          {/* FILM DNA */}
          {activeTab === 7 && (
            <div className="max-w-md mx-auto bg-surface border border-white/[0.06] rounded-2xl p-8">
              <h3 className="font-display text-xl font-bold text-center mb-6">Your Film DNA</h3>
              <div className="flex flex-col gap-4">
                {[
                  { name: "Realism", value: 72 },
                  { name: "Visual Style", value: 85 },
                  { name: "Pacing", value: 60 },
                  { name: "Tonal Complexity", value: 78 },
                  { name: "Narrative Structure", value: 65 },
                  { name: "Emotional Intensity", value: 90 },
                ].map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{d.name}</span>
                      <span className="text-amber font-bold">{d.value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber to-amber/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${d.value}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted text-center mt-6">Rate more films to refine your DNA profile</p>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
