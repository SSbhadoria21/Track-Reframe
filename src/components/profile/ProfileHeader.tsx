"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { createClient } from "@/lib/supabase/client";

interface ProfileHeaderProps {
  userId: string;
  displayName: string;
  username: string;
  initials: string;
  role: string;
  bio: string;
  location: string;
  joinDate: string;
  website: string;
  isVerified?: boolean;
  avatarUrl?: string | null;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export function ProfileHeader({
  userId,
  displayName,
  username,
  initials,
  role,
  bio,
  location,
  joinDate,
  website,
  isVerified = true,
  avatarUrl,
  isOwner = true,
  onUpdate
}: ProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
    // Reset input value so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="relative px-6 -mt-16 z-10 flex flex-col md:flex-row items-start gap-5">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative shrink-0 ${isOwner ? 'group cursor-pointer' : ''}`}
          onClick={() => isOwner && !avatarUploading && fileInputRef.current?.click()}
        >
          {isOwner && <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />}
          
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo to-indigo-hover flex items-center justify-center text-white text-3xl md:text-4xl font-bold border-4 border-background shadow-xl shadow-indigo/20 overflow-hidden relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            
            {/* Hover Overlay */}
            {isOwner && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {/* Online indicator */}
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-success border-[3px] border-background z-10" />
        </motion.div>

        {/* Info */}
        <div className="flex-1 pt-2 md:pt-8 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white truncate">
              {displayName}
            </h1>

            {/* Verified checkmark */}
            {isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                className="w-6 h-6 rounded-full bg-amber flex items-center justify-center shrink-0"
                title="Verified Creator"
              >
                <svg className="w-3.5 h-3.5 text-[#0A0A0F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}

            {/* Role badge */}
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo/15 text-indigo border border-indigo/25">
              {role}
            </span>
          </div>

          <span className="text-sm text-text-muted mt-1 block">@{username}</span>

          {/* Bio */}
          <p className="text-sm text-text-secondary leading-relaxed mt-3 max-w-xl">
            {bio}
          </p>

          {/* Inline metadata */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {location && <MetaItem icon={<LocationPin />} text={location} />}
            <MetaItem icon={<CalendarIcon />} text={`Joined ${joinDate}`} />
            {website && <MetaItem icon={<LinkIcon />} text={website} isLink />}
          </div>
        </div>

        {/* Edit profile button */}
        {isOwner && (
          <div className="md:pt-8 shrink-0">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-2 rounded-xl border border-white/15 text-sm font-medium text-text-secondary hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-200 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            initialData={{ displayName, bio, location, website, role }}
            onClose={() => setIsEditModalOpen(false)}
            onSave={() => {
              setIsEditModalOpen(false);
              onUpdate?.();
            }}
          />
        )}

        {cropModalOpen && imageSrc && (
          <AvatarCropperModal
            imageSrc={imageSrc}
            userId={userId}
            onClose={() => {
              setCropModalOpen(false);
              setImageSrc(null);
            }}
            onSave={() => {
              setCropModalOpen(false);
              setImageSrc(null);
              setAvatarUploading(true);
            }}
            onComplete={() => {
              setAvatarUploading(false);
              onUpdate?.();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EditProfileModal({ initialData, onClose, onSave }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: initialData.displayName || "",
    bio: initialData.bio === "No bio added yet." ? "" : initialData.bio,
    city: initialData.location ? initialData.location.split(",")[0].trim() : "",
    country: initialData.location && initialData.location.includes(",") ? initialData.location.split(",")[1].trim() : "",
    portfolio_url: initialData.website || "",
    role: initialData.role || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        roles: formData.role ? [formData.role] : []
      };
      
      console.log("Sending profile update payload:", payload);

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSave();
      } else {
        const errorData = await res.json();
        alert("Failed to update profile: " + (errorData.error || "Unknown DB error"));
      }
    } catch (error) {
      console.error(error);
      alert("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="font-display font-bold text-lg text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Display Name</label>
              <input type="text" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Role (e.g. Director, Cinematographer)</label>
              <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">City</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Country</label>
                <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Website / Portfolio URL</label>
              <input type="url" value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo transition-colors" />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-5 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-white transition-colors">Cancel</button>
          <button type="submit" form="profile-form" disabled={loading} className="px-5 py-2 rounded-xl bg-indigo text-white text-sm font-bold shadow-lg shadow-indigo/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MetaItem({ icon, text, isLink }: { icon: React.ReactNode; text: string; isLink?: boolean }) {
  const content = (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      {icon}
      <span className={isLink ? "text-amber hover:underline cursor-pointer" : ""}>{text}</span>
    </span>
  );
  return isLink ? <a href={text.startsWith('http') ? text : `https://${text}`} target="_blank" rel="noreferrer">{content}</a> : content;
}

function LocationPin() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function AvatarCropperModal({ imageSrc, userId, onClose, onSave, onComplete }: any) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    if (!croppedAreaPixels || !userId) return;
    
    setLoading(true);
    onSave(); // Close modal immediately and show loading spinner on avatar

    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (!croppedImageBlob) throw new Error("Failed to crop image");

      const fileExt = "jpg"; // We generate jpeg in cropImage.ts
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, croppedImageBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update users table
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl })
      });

      if (!res.ok) {
        throw new Error("Failed to update profile database");
      }
      
      // Dispatch custom event to update TopBar and Sidebar instantly
      window.dispatchEvent(new CustomEvent('updateAvatar', { detail: publicUrl }));
      
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("Failed to upload avatar. Check console.");
    } finally {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="font-display font-bold text-lg text-white">Crop Profile Photo</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative w-full h-[300px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 bg-black/20 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted">Zoom</span>
            <input 
              type="range" 
              value={zoom} 
              min={1} 
              max={3} 
              step={0.1} 
              aria-labelledby="Zoom" 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="flex-1 accent-indigo h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleUpload} 
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo text-white text-sm font-bold shadow-lg shadow-indigo/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Apply & Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
