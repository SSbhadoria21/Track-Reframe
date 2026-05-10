"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlusIcon, VideoIcon, XIcon, FilmIcon, SendIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

interface PostComposerProps {
  userInitials: string;
  userName: string;
  onPostCreated: (post: any) => void;
}

const POST_TAGS = ["Drama", "Action", "Comedy", "Thriller", "Romance", "Sci-Fi", "Horror", "Documentary", "Short Film", "BTS"];

export function PostComposer({ userInitials, userName, onPostCreated }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [audience, setAudience] = useState<'public' | 'followers'>('public');
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [filmLink, setFilmLink] = useState<string | null>(null);
  const [showScriptInput, setShowScriptInput] = useState(false);
  const [showFilmInput, setShowFilmInput] = useState(false);
  const [tempScript, setTempScript] = useState("");
  const [tempFilmLink, setTempFilmLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return toast.error("File is too large (max 50MB)");
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaFile(file);
    setMediaType(type);
    
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    
    setIsExpanded(true);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setScriptContent(null);
    setFilmLink(null);
    setShowScriptInput(false);
    setShowFilmInput(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setPosting(true);
    setError(null);

    try {
      let mediaUrl = null;

      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);

        const uploadRes = await fetch("/api/posts/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || "Upload failed");
        }

        const { url } = await uploadRes.json();
        mediaUrl = url;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          type: scriptContent ? "script" : filmLink ? "film" : "text",
          media_url: mediaUrl,
          media_type: mediaType,
          genre_tags: selectedTags,
          audience,
          script_content: scriptContent,
          film_link: filmLink,
        }),
      });


      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to post" }));
        setError(err.error || "Failed to create post");
        setPosting(false);
        return;
      }

      const { post } = await res.json();
      onPostCreated(post);
      
      // Reset state
      setContent("");
      setSelectedTags([]);
      clearMedia();
      setIsExpanded(false);
      toast.success("Post shared successfully!");
    } catch (err: any) {
      console.error(err);
      setError("Failed to share post. Please try again.");
    }
    setPosting(false);
  };

  return (
    <div className="bg-elevated border border-white/[0.06] rounded-2xl overflow-hidden transition-all shadow-xl shadow-black/20">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*,video/*" 
        className="hidden" 
      />

      {/* Composer Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-indigo/20 border border-indigo/40 flex items-center justify-center font-bold text-sm text-indigo shrink-0 shadow-lg shadow-indigo/10">
          {userInitials}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's on your mind, filmmaker?"
            rows={isExpanded ? 3 : 1}
            className="w-full bg-transparent text-sm text-white placeholder:text-text-muted/50 resize-none focus:outline-none leading-relaxed"
          />

          {/* Script / Film Link Input Areas */}
          <AnimatePresence>
            {showScriptInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 relative">
                <textarea
                  value={tempScript}
                  onChange={(e) => { setTempScript(e.target.value); setScriptContent(e.target.value); }}
                  placeholder="Paste your screenplay scene here..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs text-white/80 placeholder:text-white/30 resize-none h-32 focus:outline-none focus:border-indigo"
                />
                <button onClick={() => { setShowScriptInput(false); setTempScript(""); setScriptContent(null); }} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-error transition-colors"><XIcon className="w-3 h-3" /></button>
              </motion.div>
            )}
            {showFilmInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 relative">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:border-amber transition-colors">
                  <FilmIcon className="w-4 h-4 text-amber/60 ml-2" />
                  <input
                    type="url"
                    value={tempFilmLink}
                    onChange={(e) => { setTempFilmLink(e.target.value); setFilmLink(e.target.value); }}
                    placeholder="https://vimeo.com/..."
                    className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none p-1"
                  />
                </div>
                <button onClick={() => { setShowFilmInput(false); setTempFilmLink(""); setFilmLink(null); }} className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-text-muted hover:text-error transition-colors"><XIcon className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Preview */}
          <AnimatePresence>
            {mediaPreview && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative mt-4 rounded-2xl overflow-hidden border border-white/10 group bg-black/40"
                >
                    <button 
                        onClick={clearMedia}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-error"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                    
                    <div className="w-full aspect-video flex items-center justify-center overflow-hidden">
                        {mediaType === 'image' ? (
                            <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <video src={mediaPreview} className="w-full h-full object-cover" controls={false} autoPlay muted loop />
                        )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            {mediaType === 'image' ? <ImagePlusIcon className="w-3 h-3" /> : <VideoIcon className="w-3 h-3" />}
                            {mediaType === 'image' ? 'Image Attached' : 'Video Attached'}
                        </span>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/[0.02]"
          >
            {/* Tags */}
            <div className="px-4 pb-3 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {POST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-amber text-[#0A0A0F] border-amber"
                        : "border-white/[0.08] text-text-muted hover:text-white hover:border-white/15"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-white/[0.04] gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-amber hover:bg-amber/10 transition-all group flex items-center gap-2 shrink-0"
                >
                    <ImagePlusIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:block">Photo</span>
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-blue-400 hover:bg-blue-400/10 transition-all group flex items-center gap-2 shrink-0"
                >
                    <VideoIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:block">Video</span>
                </button>
                <button 
                    onClick={() => { setShowFilmInput(!showFilmInput); setShowScriptInput(false); }}
                    className={`p-2 rounded-xl text-text-muted transition-all group flex items-center gap-2 shrink-0 ${showFilmInput || filmLink ? 'text-amber bg-amber/10' : 'bg-white/5 hover:text-amber hover:bg-amber/10'}`}
                >
                    <FilmIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:block">Film Link</span>
                </button>
                <button 
                    onClick={() => { setShowScriptInput(!showScriptInput); setShowFilmInput(false); }}
                    className={`p-2 rounded-xl text-text-muted transition-all group flex items-center gap-2 shrink-0 ${showScriptInput || scriptContent ? 'text-indigo bg-indigo/10' : 'bg-white/5 hover:text-indigo hover:bg-indigo/10'}`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:block">Script</span>
                </button>
                <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />
                <span className="text-[10px] text-text-muted font-medium shrink-0">
                  {content.length} chars
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select 
                  value={audience} 
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="bg-transparent border border-white/10 rounded-lg text-xs text-text-muted px-2 py-1.5 outline-none focus:border-amber transition-colors"
                >
                  <option value="public" className="bg-[#111118]">Public</option>
                  <option value="followers" className="bg-[#111118]">Followers Only</option>
                </select>
                <button
                  onClick={() => { setIsExpanded(false); setContent(""); setSelectedTags([]); setError(null); clearMedia(); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={(!content.trim() && !mediaFile) || posting}
                  className="px-5 py-2 rounded-xl bg-amber text-[#0A0A0F] font-black uppercase tracking-widest text-[10px] hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex items-center gap-2 shadow-lg shadow-amber/20"
                >
                  {posting ? (
                    <><span className="w-3 h-3 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" /> Sharing...</>
                  ) : (
                    <><SendIcon className="w-3 h-3" /> Post</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

