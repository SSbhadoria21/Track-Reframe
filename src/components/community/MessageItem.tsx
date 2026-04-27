"use client";

import { motion } from "framer-motion";
import { FilmReelIcon, PlayIcon, ExternalLinkIcon } from "@/components/icons";

interface MessageItemProps {
  message: any;
  isOwn: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const profile = message.users;
  const initials = profile?.display_name?.substring(0, 2).toUpperCase() || "??";

  const renderContent = () => {
    switch (message.type) {
      case "script_snippet":
        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber bg-amber/10 px-2 py-0.5 rounded border border-amber/20">Script Excerpt</span>
              <button className="text-[10px] font-bold text-text-muted hover:text-amber transition-colors flex items-center gap-1">
                View full script <ExternalLinkIcon className="w-2.5 h-2.5" />
              </button>
            </div>
            <pre className="font-mono text-xs leading-relaxed bg-[#0D0D12] p-4 rounded-xl border border-white/5 text-text-secondary overflow-x-auto scrollbar-hide italic">
              {message.content}
            </pre>
          </div>
        );
      
      case "film_link":
        return (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <div className="aspect-video w-full bg-black rounded-xl border border-white/10 overflow-hidden relative group cursor-pointer film-strip-border p-1">
              <img src={message.og_data?.image || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000"} alt="" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-amber text-black flex items-center justify-center shadow-xl shadow-amber/40">
                  <PlayIcon className="w-6 h-6 ml-1" />
                </div>
              </div>
            </div>
            <div className="bg-[#1A1A25] p-3 rounded-xl border border-white/5">
              <h4 className="text-sm font-bold text-white truncate">{message.og_data?.title || "Untitled Production"}</h4>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold">Directed by @{profile?.username || "creator"}</p>
              <button className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-amber transition-all">
                Watch on Track Reframe
              </button>
            </div>
          </div>
        );

      case "file":
        return (
          <div className="flex items-center gap-3 bg-[#1A1A25] p-3 rounded-xl border border-white/5 hover:border-amber/30 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
               <FilmReelIcon className="w-5 h-5 text-amber" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-white truncate">{message.content}</p>
               <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Production Asset</p>
            </div>
            <a 
              href={message.media_url} 
              target="_blank" 
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-all"
            >
               <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
        );

      case "image":
        return (
          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={message.media_url} alt="" className="w-full h-auto cursor-zoom-in hover:scale-[1.02] transition-transform duration-500" />
          </div>
        );

      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-9 h-9 rounded-full bg-indigo/20 border border-indigo/30 flex items-center justify-center text-indigo font-bold text-xs shrink-0 mt-1">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[85%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Name & Time */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-xs font-bold text-amber">{profile?.display_name || "Unknown Creator"}</span>
            <span className="text-[10px] text-text-muted">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div 
          className={`px-4 py-3 rounded-2xl relative group transition-all duration-300 ${
            message.type === 'text' 
              ? isOwn 
                ? "bg-[#1A1A40] text-white rounded-tr-sm border-l-4 border-indigo/50 shadow-lg shadow-indigo/10" 
                : "bg-[#1A1A25] text-text-secondary rounded-tl-sm border border-white/[0.04]"
              : "p-0 bg-transparent"
          }`}
        >
          {renderContent()}
          
          {/* Reaction Bar Mockup */}
          <div className={`absolute -bottom-4 ${isOwn ? "right-0" : "left-0"} flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75 origin-top`}>
             <div className="bg-[#1A1A25] border border-white/10 rounded-full px-2 py-0.5 flex gap-1.5 shadow-xl shadow-black/50">
                <span className="text-xs cursor-pointer hover:scale-125 transition-transform">🎬</span>
                <span className="text-xs cursor-pointer hover:scale-125 transition-transform">👁️</span>
                <span className="text-xs cursor-pointer hover:scale-125 transition-transform">⭐</span>
             </div>
          </div>

          {/* Timestamp on hover for own messages */}
          {isOwn && (
            <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
