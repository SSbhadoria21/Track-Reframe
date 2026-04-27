"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, PlayIcon, CheckIcon, PlusIcon, FilmIcon } from "@/components/icons";
import { toast } from "react-hot-toast";

interface SubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  compId: string;
}

const GENRES = ["Action", "Drama", "Horror", "Comedy", "Thriller", "Sci-Fi", "Experimental", "Animation"];
const CINEFORGE_TOOLS = [
    "Script Continuity AI", "Script Formatter", "Shot Planner", 
    "Mood Board Generator", "Budget Estimator", "Call Sheet Generator"
];

export function SubmissionForm({ isOpen, onClose, compId }: SubmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isLinkValid, setIsLinkValid] = useState<boolean | null>(null);
  const [useCustomThumbnail, setUseCustomThumbnail] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    video_link: "",
    thumbnail_url: "",
    genre_tags: [] as string[],
    runtime_seconds: 0,
    language: "English",
    synopsis: "",
    director_name: "",
    cast_list: [] as string[],
    crew_list: [{ role: "Cinematographer", name: "" }] as { role: string, name: string }[],
    inspiration: "",
    cineforge_tools_used: [] as string[],
    declaration_accepted: false
  });

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("youtube.com/shorts/")) videoId = url.split("shorts/")[1].split("?")[0];
    
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    if (url.includes("vimeo.com/")) {
        const vimeoId = url.split("vimeo.com/")[1].split("?")[0];
        return `https://player.vimeo.com/video/${vimeoId}`;
    }
    return "";
  };

  const validateLink = async () => {
    setIsValidating(true);
    const link = formData.video_link.toLowerCase();
    const isYT = link.includes("youtube.com") || link.includes("youtu.be");
    const isVimeo = link.includes("vimeo.com");

    setTimeout(() => {
        if (isYT || isVimeo) {
            setIsLinkValid(true);
            toast.success("Link validated!");
        } else {
            setIsLinkValid(false);
            toast.error("Please use a valid YouTube or Vimeo link");
        }
        setIsValidating(false);
    }, 800);
  };



  const handleSubmit = async () => {
    if (!isLinkValid) return toast.error("Please validate your video link first");
    if (!formData.declaration_accepted) return toast.error("You must accept the declaration");

    setLoading(true);
    try {
      const res = await fetch("/api/competitions/submit", {
        method: "POST",
        body: JSON.stringify({ ...formData, competition_id: compId })
      });
      if (res.ok) {
        toast.success("Entry submitted successfully!");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to submit entry");
    } finally {
      setLoading(false);
    }
  };

  const addCrewRow = () => {
    if (formData.crew_list.length >= 20) return;
    setFormData({
      ...formData,
      crew_list: [...formData.crew_list, { role: "", name: "" }]
    });
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
        ...prev,
        genre_tags: prev.genre_tags.includes(genre) 
            ? prev.genre_tags.filter(g => g !== genre)
            : [...prev.genre_tags, genre]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="relative w-full max-w-4xl h-full md:h-[90vh] bg-[#0A0A0F] border-x border-t border-white/10 rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber flex items-center justify-center shadow-lg shadow-amber/20">
                    <FilmIcon className="w-6 h-6 text-black" />
                </div>
                <div>
                    <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tighter">Submit Your Masterpiece</h2>
                    <p className="text-xs text-text-muted font-mono">TRACK REFRAME FILM CHALLENGE // ENTRY FORM</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-text-muted transition-all">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
            {/* Video Section */}
            <section className="space-y-6">
                <h3 className="text-sm font-bold text-amber uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber" /> Video Source
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="YouTube or Vimeo Link"
                                value={formData.video_link}
                                onChange={(e) => {
                                    setFormData({...formData, video_link: e.target.value});
                                    setIsLinkValid(null);
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-32 text-white focus:border-amber/50 outline-none"
                            />
                            <button 
                                onClick={validateLink}
                                disabled={isValidating || !formData.video_link}
                                className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-amber/10 text-amber text-xs font-bold uppercase hover:bg-amber/20 transition-all disabled:opacity-50"
                            >
                                {isValidating ? "Checking..." : "Validate Link"}
                            </button>
                        </div>
                        {isLinkValid === true && (
                            <div className="flex items-center gap-2 text-success text-[10px] font-bold uppercase">
                                <CheckIcon className="w-3 h-3" /> Link Verified
                            </div>
                        )}
                        {isLinkValid === false && (
                            <div className="flex items-center gap-2 text-error text-[10px] font-bold uppercase">
                                <XIcon className="w-3 h-3" /> Invalid Link
                            </div>
                        )}
                    </div>

                    <div className="aspect-video rounded-3xl bg-black border border-white/10 flex items-center justify-center overflow-hidden group relative">
                        {isLinkValid && formData.video_link ? (
                            <iframe 
                                src={getVideoEmbedUrl(formData.video_link)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center space-y-2 opacity-20">
                                <PlayIcon className="w-12 h-12 mx-auto" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Video Preview</p>
                            </div>
                        )}
                    </div>

                </div>
            </section>

            {/* Basic Info */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-amber uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber" /> Film Details
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Film Title</label>
                            <input 
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Runtime (MM:SS)</label>
                                <input 
                                    type="text"
                                    placeholder="00:00"
                                    onChange={(e) => {
                                        const [m, s] = e.target.value.split(":").map(n => parseInt(n) || 0);
                                        setFormData({...formData, runtime_seconds: (m * 60) + s});
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Language</label>
                                <input 
                                    type="text"
                                    value={formData.language}
                                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-amber uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber" /> Genre Selection
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {GENRES.map(g => (
                            <button 
                                key={g}
                                onClick={() => toggleGenre(g)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all border ${
                                    formData.genre_tags.includes(g)
                                        ? "bg-amber text-black border-amber"
                                        : "bg-white/5 text-text-muted border-white/10 hover:border-white/20"
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Synopsis */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber" /> Synopsis
                    </h3>
                    <span className={`text-[10px] font-mono font-bold ${formData.synopsis.length > 450 ? 'text-amber' : 'text-text-muted'}`}>
                        {formData.synopsis.length} / 500
                    </span>
                </div>
                <textarea 
                    maxLength={500}
                    rows={4}
                    value={formData.synopsis}
                    onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                    placeholder="Brief summary of your film..."
                    className="w-full bg-black/40 border border-white/10 rounded-[32px] p-6 text-white focus:border-amber/50 outline-none resize-none leading-relaxed"
                />
            </section>

            {/* Cast & Crew */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-amber uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber" /> The Team
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Director Name</label>
                            <input 
                                type="text"
                                value={formData.director_name}
                                onChange={(e) => setFormData({...formData, director_name: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Cast (comma separated)</label>
                            <input 
                                type="text"
                                placeholder="e.g. Robert De Niro, Al Pacino"
                                onBlur={(e) => setFormData({...formData, cast_list: e.target.value.split(",").map(s => s.trim())})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-amber uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber" /> Production Crew
                        </h3>
                        <button onClick={addCrewRow} className="text-xs font-bold text-amber hover:underline">+ Add Row</button>
                    </div>
                    <div className="space-y-3">
                        {formData.crew_list.map((crew, i) => (
                            <div key={i} className="grid grid-cols-2 gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Role" 
                                    value={crew.role}
                                    onChange={(e) => {
                                        const newList = [...formData.crew_list];
                                        newList[i].role = e.target.value;
                                        setFormData({...formData, crew_list: newList});
                                    }}
                                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber/50"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    value={crew.name}
                                    onChange={(e) => {
                                        const newList = [...formData.crew_list];
                                        newList[i].name = e.target.value;
                                        setFormData({...formData, crew_list: newList});
                                    }}
                                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber/50"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CineForge Tools Toggle */}
            <section className="p-8 rounded-[32px] bg-amber/5 border border-amber/10 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-amber uppercase tracking-widest">Made with Track Reframe Tools?</h3>
                        <p className="text-xs text-text-muted mt-1">Select the tools used in this production for a special badge bonus.</p>
                    </div>
                    <button 
                        onClick={() => setShowTools(!showTools)}
                        className={`w-14 h-8 rounded-full transition-all relative p-1 ${showTools ? 'bg-amber' : 'bg-white/10'}`}
                    >
                        <motion.div 
                            animate={{ x: showTools ? 24 : 0 }}
                            className={`w-6 h-6 rounded-full shadow-sm ${showTools ? 'bg-black' : 'bg-text-muted'}`}
                        />
                    </button>
                </div>

                <AnimatePresence>
                    {showTools && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                                {CINEFORGE_TOOLS.map(tool => (
                                    <label key={tool} className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 cursor-pointer hover:border-amber/30 transition-all">
                                        <input 
                                            type="checkbox"
                                            checked={formData.cineforge_tools_used.includes(tool)}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    cineforge_tools_used: e.target.checked 
                                                        ? [...prev.cineforge_tools_used, tool]
                                                        : prev.cineforge_tools_used.filter(t => t !== tool)
                                                }));
                                            }}
                                            className="w-4 h-4 accent-amber"
                                        />
                                        <span className="text-[10px] font-bold text-text-secondary uppercase">{tool}</span>
                                    </label>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Declaration */}
            <section className="pt-8 border-t border-white/5 space-y-6">
                 <label className="flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 cursor-pointer group">
                    <input 
                        type="checkbox"
                        checked={formData.declaration_accepted}
                        onChange={(e) => setFormData({...formData, declaration_accepted: e.target.checked})}
                        className="w-6 h-6 mt-1 accent-amber"
                    />
                    <div className="space-y-1">
                        <span className="text-sm font-bold text-white group-hover:text-amber transition-colors">I declare that this is my original work.</span>
                        <p className="text-xs text-text-muted leading-relaxed">
                            By submitting, you confirm that you hold all necessary rights (including music, script, and likeness) and agree to the Track Reframe Competition terms.
                        </p>
                    </div>
                 </label>

                 <button 
                    onClick={handleSubmit}
                    disabled={loading || !formData.declaration_accepted}
                    className="w-full py-6 rounded-[32px] bg-amber text-black font-black text-xl uppercase tracking-tighter hover:bg-amber/90 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                 >
                    {loading ? "Submitting Entry..." : (
                        <>
                            Submit to Competition
                            <PlayIcon className="w-6 h-6 fill-black group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                 </button>
            </section>
        </div>
      </motion.div>
    </div>
  );
}
