"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Film {
  id: string;
  title: string;
  genres?: string[];
  genre_tags?: string[];
  runtime?: string;
  runtime_seconds?: number;
  rating?: number;
  avg_rating?: number;
  year?: string;
  release_year?: number;
  role?: string;
  color?: string;
  thumbnail_url?: string;
  video_link?: string;
  synopsis?: string;
}

export function FilmsTab({ userId, isOwner = true }: { userId?: string, isOwner?: boolean }) {
  const [films, setFilms] = useState<Film[]>([]);
  const [hoveredFilm, setHoveredFilm] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFilms = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/films?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFilms(data.films || []);
      }
    } catch (error) {
      console.error("Error fetching films:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilms();
  }, [userId]);

  return (
    <div>
      {isOwner && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo text-white text-sm font-bold shadow-lg shadow-indigo/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Film
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
        </div>
      ) : films.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-1">No Films Yet</h3>
          <p className="text-sm text-text-muted max-w-sm">
            Upload your films and short projects to build your portfolio and showcase your work to the community.
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {films.map((film, i) => {
            const displayGenres = film.genre_tags || film.genres || [];
            const displayRating = film.avg_rating || film.rating || 0;
            const displayYear = film.release_year || film.year || "2024";
            const displayRuntime = film.runtime_seconds ? `${Math.floor(film.runtime_seconds / 60)}m` : (film.runtime || "N/A");

            return (
              <motion.div
                key={film.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group relative"
                onMouseEnter={() => setHoveredFilm(film.id)}
                onMouseLeave={() => setHoveredFilm(null)}
              >
                <div className={`relative overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br ${film.color || 'from-[#1A1A24] to-[#0A0A0F]'} cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/20`}>
                  <div className={`relative ${i % 3 === 0 ? "h-[260px]" : i % 3 === 1 ? "h-[200px]" : "h-[230px]"}`}>
                    {film.thumbnail_url ? (
                      <img src={film.thumbnail_url} alt={film.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 bg-[#0A0A0F]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-20 h-20 text-white/5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/80 to-transparent">
                      <h3 className="font-display font-bold text-base text-white mb-1 group-hover:text-amber transition-colors">{film.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {displayGenres.slice(0, 2).map((g) => (
                          <span key={g} className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-text-secondary border border-white/5">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
                      <svg className="w-3 h-3 text-amber fill-amber" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                      <span className="text-xs font-bold text-amber">{displayRating}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0D0D12]/80 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-muted">{displayYear}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[10px] text-text-muted">{displayRuntime}</span>
                    </div>
                    <span className="text-[10px] font-medium text-indigo bg-indigo/10 px-2 py-0.5 rounded-full border border-indigo/20">{film.role || "Director"}</span>
                  </div>
                  <AnimatePresence>
                    {hoveredFilm === film.id && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="w-14 h-14 rounded-full bg-amber/90 flex items-center justify-center shadow-lg shadow-amber/30">
                          {film.video_link ? (
                            <a href={film.video_link} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-full">
                              <svg className="w-6 h-6 text-[#0A0A0F] ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </a>
                          ) : (
                            <svg className="w-6 h-6 text-[#0A0A0F] ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isAddModalOpen && (
          <AddFilmModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdded={() => {
              setIsAddModalOpen(false);
              fetchFilms();
            }}
            userId={userId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddFilmModal({ onClose, onAdded, userId }: any) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    video_link: "",
    thumbnail_url: "",
    genre_tags: "",
    runtime_seconds: "",
    synopsis: "",
    release_year: new Date().getFullYear().toString()
  });

  const supabase = createClient();

  const getYouTubeID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("Title is required");

    setLoading(true);
    console.log("Starting film submission...");
    try {
      let finalVideoLink = formData.video_link;
      let finalThumbnail = formData.thumbnail_url;

      if (!formData.video_link) {
        return alert("Please provide a YouTube video link.");
      }

      console.log("Processing YouTube URL...");
      const ytId = getYouTubeID(formData.video_link);
      if (!ytId) return alert("Invalid YouTube URL");
      finalThumbnail = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;

      console.log("Sending metadata to API...");
      const payload = {
        ...formData,
        video_link: finalVideoLink,
        thumbnail_url: finalThumbnail,
        genre_tags: formData.genre_tags.split(",").map(s => s.trim()).filter(Boolean),
        runtime_seconds: parseInt(formData.runtime_seconds) || 0,
        release_year: parseInt(formData.release_year) || new Date().getFullYear()
      };

      const res = await fetch("/api/films", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onAdded();
      } else {
        const err = await res.json();
        alert("Failed to add film: " + (err.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Error saving film");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="font-display font-bold text-lg text-white">Add Film</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] scrollbar-hide">
          <form id="add-film-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Film Title</label>
              <input type="text" required value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" placeholder="e.g. The Neon Dream" />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">YouTube URL</label>
              <input type="url" required value={formData.video_link || ""} onChange={e => setFormData({...formData, video_link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Release Year</label>
                <input type="number" value={formData.release_year || ""} onChange={e => setFormData({...formData, release_year: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Runtime (Seconds)</label>
                <input type="number" value={formData.runtime_seconds || ""} onChange={e => setFormData({...formData, runtime_seconds: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" placeholder="e.g. 600 for 10m" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Genres (Comma separated)</label>
              <input type="text" value={formData.genre_tags || ""} onChange={e => setFormData({...formData, genre_tags: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" placeholder="Sci-Fi, Neo-Noir, Drama" />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Synopsis</label>
              <textarea value={formData.synopsis || ""} onChange={e => setFormData({...formData, synopsis: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors resize-none" placeholder="A brief description of your film..." />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <button onClick={onClose} type="button" className="px-5 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-indigo text-white text-sm font-bold shadow-lg shadow-indigo/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                {loading ? "Saving..." : "Add Film"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
