"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface CoverBannerProps {
  coverUrl?: string | null;
  userId?: string;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export function CoverBanner({ coverUrl, userId, isOwner = true, onUpdate }: CoverBannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    try {
      // 1. Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/cover_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 2. Update profile
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_url: publicUrl })
      });

      if (res.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error uploading cover:", error);
      alert("Failed to upload cover image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveCover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    
    setIsUploading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_url: null })
      });

      if (res.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error removing cover:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`relative w-full h-[220px] md:h-[280px] overflow-hidden rounded-b-3xl ${isOwner ? 'group cursor-pointer' : ''}`}
      onMouseEnter={() => isOwner && setIsHovered(true)}
      onMouseLeave={() => isOwner && setIsHovered(false)}
      onClick={() => isOwner && fileInputRef.current?.click()}
    >
      {isOwner && (
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      )}

      {coverUrl ? (
        <img src={coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          {/* Background gradient with cinematic feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e2e] via-[#0f1628] to-[#0A0A0F]" />

          {/* Animated aperture pattern */}
          <div className="absolute inset-0 opacity-[0.04]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="aperture-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="12" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="30" cy="30" r="6" fill="none" stroke="white" strokeWidth="0.3" />
                  <line x1="30" y1="18" x2="30" y2="42" stroke="white" strokeWidth="0.2" />
                  <line x1="18" y1="30" x2="42" y2="30" stroke="white" strokeWidth="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#aperture-grid)" />
            </svg>
          </div>

          {/* Film grain overlay */}
          <div className="absolute inset-0 bg-grain" />

          {/* Decorative glowing orbs */}
          <div className="absolute top-[-40px] right-[20%] w-[200px] h-[200px] rounded-full bg-indigo/10 blur-[80px]" />
          <div className="absolute bottom-[-30px] left-[10%] w-[160px] h-[160px] rounded-full bg-amber/8 blur-[60px]" />
        </>
      )}

      {/* Film strip sprockets along top */}
      <div className="absolute top-0 left-0 right-0 h-3 film-strip-border border-0 border-b opacity-30" />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Hover overlay */}
      {isOwner && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-0 gap-3"
      >
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          )}
          <span className="text-sm font-medium text-white">
            {isUploading ? "Uploading..." : "Change Cover"}
          </span>
        </div>

        {coverUrl && !isUploading && (
          <button 
            onClick={handleRemoveCover}
            className="px-4 py-1.5 rounded-lg bg-error/20 border border-error/30 text-error text-xs font-bold hover:bg-error/30 transition-colors"
          >
            Remove Cover
          </button>
        )}
      </motion.div>
      )}
    </div>
  );
}
