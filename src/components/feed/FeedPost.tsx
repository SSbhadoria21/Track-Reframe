"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "react-hot-toast";

export function TenStarRating() {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedStar, setSelectedStar] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-1 mt-4">
      <div className="flex gap-1" onMouseLeave={() => setHoveredStar(null)}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
          const isFilled = (hoveredStar !== null && star <= hoveredStar) || (hoveredStar === null && selectedStar !== null && star <= selectedStar);
          return (
            <svg key={star} onMouseEnter={() => setHoveredStar(star)} onClick={() => setSelectedStar(star)}
              className={`w-6 h-6 cursor-pointer transition-colors ${isFilled ? "text-amber drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]" : "text-white/15"}`}
              fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          );
        })}
      </div>
      <div className="text-xs text-text-muted font-medium mt-1">
        {selectedStar ? (
          <span className="flex items-center gap-2">
            <span className="text-amber font-bold text-base">{selectedStar}</span>/10 <span className="opacity-70">(Your rating)</span>
          </span>
        ) : "Be the first to rate this film!"}
      </div>
    </div>
  );
}

export function FeedPost({ post, currentUser, onDelete, onEdit }: {
  post: any; currentUser?: any;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
}) {
  // Initialize from server data (persisted state)
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || post.likes || 0);
  const [saved, setSaved] = useState(post.user_bookmarked || false);
  const [following, setFollowing] = useState(post.is_following || false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repost_count || post.reposts || 0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const isOwner = currentUser?.id === (post.author?.id || post.user_id);

  // ─── Like (persisted) ───
  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c: number) => prev ? c - 1 : c + 1);
    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      if (!res.ok) { setLiked(prev); setLikeCount((c: number) => prev ? c + 1 : c - 1); }
    } catch { setLiked(prev); setLikeCount((c: number) => prev ? c + 1 : c - 1); }
  };

  // ─── Bookmark (persisted) ───
  const handleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    try {
      const res = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id }),
      });
      if (!res.ok) setSaved(prev);
    } catch { setSaved(prev); }
    window.dispatchEvent(new CustomEvent('postSaved', { detail: { isSaved: !prev } }));
  };

  // ─── Repost ───
  const handleRepost = async () => {
    const quote = prompt("Add a quote to your repost (optional):");
    if (quote === null) return;
    setRepostCount((c: number) => c + 1);
    try {
      const res = await fetch("/api/posts/repost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, quote_content: quote }),
      });
      if (!res.ok) setRepostCount((c: number) => c - 1);
      else toast.success("Reposted successfully!");
    } catch { setRepostCount((c: number) => c - 1); }
  };

  // ─── Share ───
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // ─── Realtime Subscriptions ───
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`post_changes_${post.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${post.id}` },
        (payload: any) => {
          if (payload.new) {
            console.log("Post updated via Postgres:", payload.new);
            setLikeCount(payload.new.like_count ?? 0);
            setCommentCount(payload.new.comment_count ?? 0);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'metrics_updated' },
        (payload: any) => {
          console.log("Post updated via Broadcast:", payload);
          if (payload.payload.type === 'like') setLikeCount(payload.payload.count);
          if (payload.payload.type === 'comment') setCommentCount(payload.payload.count);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [post.id]);

  // ─── Follow (persisted) ───
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = following;
    setFollowing(!prev);
    try {
      const res = await fetch("/api/user/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: post.user_id }),
      });
      if (!res.ok) {
        setFollowing(prev);
      } else {
        const data = await res.json();
        // Use the confirmed state from the server
        setFollowing(data.following);
        // Notify sidebar and other components about the follow change
        window.dispatchEvent(new CustomEvent('followToggled', { 
          detail: { 
            targetId: post.user_id, 
            following: data.following,
            follower_count: data.follower_count 
          } 
        }));
      }
    } catch { setFollowing(prev); }
  };

  // ─── Comments (persisted) ───
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/comments?post_id=${post.id}`);
      if (res.ok) { const { comments: data } = await res.json(); setComments(data || []); }
    } catch (err) { console.error("Failed to load comments:", err); }
    setLoadingComments(false);
  };

  const handleToggleComments = () => {
    const willShow = !showComments;
    setShowComments(willShow);
    if (willShow) fetchComments();
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    setCommentError(null);
    try {
      const res = await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
      });
      const json = await res.json();
      if (res.ok) { 
        setComments((prev) => [...prev, json.comment]); 
        setCommentCount((c: number) => c + 1);
        setCommentText(""); 
      }
      else { setCommentError(json.error || "Failed to post comment"); }
    } catch { setCommentError("Network error. Please try again."); }
    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/posts/comments?id=${commentId}&post_id=${post.id}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentCount((c: number) => Math.max(0, c - 1));
      }
    } catch (err) { console.error("Failed to delete comment:", err); }
  };

  return (
    <div className={`bg-surface border rounded-2xl p-5 flex flex-col gap-4 relative transition-colors hover:bg-elevated ${post.is_competition_entry || post.isCompetition ? 'border-l-2 border-l-amber border-y-border-default border-r-border-default glow-amber' : 'border-border-default'}`}>
      
      {(post.is_competition_entry || post.isCompetition) && (
        <div className="absolute top-0 right-0 bg-amber text-[#0A0A0F] text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
          Competition Entry
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href={`/creator/${post.username}`} className="shrink-0 hover:scale-105 transition-transform">
          <div className="w-11 h-11 rounded-full bg-indigo/20 border border-indigo/40 flex items-center justify-center font-bold text-sm text-indigo">
            {(post.author?.display_name || post.name || "U").substring(0, 2).toUpperCase()}
          </div>
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/creator/${post.username}`} className="font-bold text-text-primary text-sm truncate hover:underline">
              {post.author?.display_name || post.name}
            </Link>
            <span className="text-xs text-text-muted truncate">@{post.author?.username || post.username}</span>
            {!isOwner && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <button 
                  onClick={handleFollow}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 border ${
                    following 
                      ? "bg-transparent border-white/20 text-text-muted hover:border-white/40 hover:text-white" 
                      : "bg-amber border-amber text-black hover:bg-amber-hover hover:scale-105 active:scale-95"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="text-xs text-text-muted">{post.time}</span>
          </div>
          {post.role && <span className="text-[10px] font-medium text-text-secondary bg-surface px-2 py-0.5 rounded-full w-max mt-0.5 border border-border-default">{post.role}</span>}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-text-muted hover:text-white p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-36 bg-surface border border-border-default rounded-lg shadow-xl overflow-hidden z-20">
                {isOwner ? (<>
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors">Edit Post</button>
                  <button onClick={() => { onDelete?.(post.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors">Delete Post</button>
                </>) : (
                  <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors">Report</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CONTENT */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea value={editContent || ""} onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[80px] bg-background border border-amber/50 rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-amber transition-colors resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsEditing(false); setEditContent(post.content || ""); }} className="px-3 py-1.5 rounded-md hover:bg-elevated text-xs font-medium text-text-muted transition-colors">Cancel</button>
            <button onClick={() => { onEdit?.(post.id, editContent); setIsEditing(false); }} className="px-3 py-1.5 rounded-md bg-amber/20 text-amber hover:bg-amber/30 text-xs font-bold transition-colors">Save Changes</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary leading-relaxed">{post.content}</p>
      )}

      {/* SCRIPT TEASER */}
      {post.script_content && (
        <div className="mt-3 relative rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-sm leading-relaxed text-white/90 overflow-hidden" style={{ fontFamily: 'Courier New, Courier, monospace' }}>
          <div className={scriptExpanded ? "" : "max-h-48"}>
            {post.script_content.split('\n').map((line: string, i: number) => (
              <div key={i} className="min-h-[1.5em]">{line}</div>
            ))}
          </div>
          {!scriptExpanded && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-[2px]" />
              <button onClick={() => setScriptExpanded(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo/20 border border-indigo/40 text-indigo rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo hover:text-white transition-colors z-10 shadow-lg shadow-black/50">
                View Full Script
              </button>
            </>
          )}
        </div>
      )}

      {/* FILM LINK */}
      {post.film_link && !post.media_url && (
        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/40">
           <a href={post.film_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group">
             <div className="w-12 h-12 rounded bg-amber/20 flex items-center justify-center text-amber group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
             </div>
             <div className="flex-1 min-w-0">
               <h4 className="text-sm font-bold text-white group-hover:text-amber transition-colors">Watch Film</h4>
               <p className="text-xs text-text-muted truncate">{post.film_link}</p>
             </div>
           </a>
        </div>
      )}

      {/* COMPETITION APPLY BUTTON */}
      {post.competition_id && !post.is_competition_entry && post.content?.includes("🎬 NEW COMPETITION") && (
        <div className="mt-2">
          <Link 
            href={`/competitions?id=${post.competition_id}`}
            className="w-full py-4 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center gap-2 text-amber font-bold uppercase tracking-widest hover:bg-amber hover:text-black transition-all group"
          >
            <span>Apply to Challenge</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </div>
      )}


      {/* MEDIA */}
      {post.media_url && (
        <div className="mt-2 rounded-2xl overflow-hidden border border-white/[0.08] bg-black/40 shadow-2xl shadow-black/40 group relative">
          <div className="w-full aspect-video flex items-center justify-center">
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url} 
                controls 
                className="w-full h-full object-contain" 
                poster={post.thumbnail_url}
              />
            ) : (
              <img 
                src={post.media_url} 
                alt="Post attachment" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            )}
          </div>
          
          {/* Media Overlay Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
              {post.media_type === 'video' ? '4K Video' : 'High Res'}
            </span>
          </div>
        </div>
      )}


      {/* GENRE TAGS */}
      {post.genre_tags && post.genre_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.genre_tags.map((tag: string) => (
            <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">{tag}</span>
          ))}
        </div>
      )}

      {/* FILM CONTENT */}
      {post.type === 'film' && post.film && (
        <div className="mt-2 p-4 rounded-xl bg-background border border-border-default">
          <h3 className="font-display font-bold text-xl text-text-primary mb-2">{post.film.title}</h3>
          <div className="flex gap-2 mb-3">
            {post.film.genre_tags?.map((g: string) => (
              <span key={g} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber/10 text-amber border border-amber/20">{g}</span>
            ))}
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface text-text-secondary border border-border-default">
              {post.film.runtime_seconds ? `${Math.floor(post.film.runtime_seconds / 60)}m` : "Short"}
            </span>
          </div>
          <TenStarRating />
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-2 border-t border-border-default">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? "text-amber" : "text-text-muted hover:text-white"}`}>
            <motion.svg animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.4, ease: "easeInOut" }}
              className={`w-5 h-5 ${liked ? "fill-amber" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </motion.svg>
            <div className="overflow-hidden h-4 flex items-center">
              <AnimatePresence mode="popLayout">
                <motion.span key={likeCount} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }} transition={{ duration: 0.3 }} className="inline-block">
                  {likeCount}
                </motion.span>
              </AnimatePresence>
            </div>
          </button>

          {/* Repost */}
          <button onClick={handleRepost} className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-green-400 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
            {repostCount > 0 && <span className="inline-block">{repostCount}</span>}
          </button>

          {/* Comment */}
          <button onClick={handleToggleComments} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showComments ? "text-white" : "text-text-muted hover:text-white"}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            {commentCount}
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-blue-400 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
        </div>

        {/* Bookmark — persisted */}
        <button onClick={handleSave} className={`p-2 transition-colors flex items-center gap-1.5 text-xs font-medium ${saved ? "text-indigo" : "text-text-muted hover:text-white"}`}>
          <svg className={`w-5 h-5 ${saved ? "fill-indigo" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>

      {/* COMMENTS SECTION */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 pt-4 flex flex-col gap-4">
            
            {loadingComments && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-amber/40 border-t-amber rounded-full animate-spin" />
              </div>
            )}

            {comments.length > 0 && (
              <div className="flex flex-col gap-3">
                {comments.map((c: any) => {
                  const author = c.author;
                  const cInitials = (author?.display_name || "A").substring(0, 2).toUpperCase();
                  const cIsOwner = currentUser?.username === author?.username;
                  return (
                    <div key={c.id} className="flex gap-3 group relative">
                      <div className="w-8 h-8 rounded-full bg-indigo/20 text-indigo flex items-center justify-center font-bold text-xs shrink-0 border border-indigo/30">{cInitials}</div>
                      <div className="flex-1 bg-surface p-3 rounded-xl border border-border-default relative">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-text-primary">{author?.display_name || "User"}</span>
                          <span className="text-[10px] text-text-muted">@{author?.username || "user"}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{c.content}</p>
                        {cIsOwner && (
                          <button onClick={() => handleDeleteComment(c.id)} className="absolute top-2 right-2 p-1 text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingComments && comments.length === 0 && (
              <p className="text-xs text-text-muted text-center py-2">No comments yet. Be the first!</p>
            )}

            {commentError && (
              <p className="text-xs text-error text-center py-1 px-3 bg-error/10 border border-error/20 rounded-lg">{commentError}</p>
            )}

            <div className="flex gap-3 mt-1">
              <div className="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center text-indigo text-xs font-bold shrink-0 border border-indigo/40">
                {currentUser?.initials || "U"}
              </div>
              <div className="flex-1 flex gap-2">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) handlePostComment(); }}
                  placeholder="Add a comment..." className="flex-1 bg-background border border-border-default rounded-full px-4 text-sm focus:outline-none focus:border-amber transition-colors" />
                <button onClick={handlePostComment} disabled={!commentText.trim() || postingComment}
                  className="px-4 rounded-full bg-elevated text-sm font-medium hover:bg-surface disabled:opacity-50 transition-colors flex items-center gap-1 border border-border-default">
                  {postingComment ? <span className="w-3 h-3 border-2 border-amber/40 border-t-amber rounded-full animate-spin" /> : "Post"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {isShareModalOpen && (
          <ShareModal 
            post={post}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareModal({ post, onClose }: { post: any, onClose: () => void }) {
  const url = `${window.location.origin}/post/${post.id}`;
  const title = encodeURIComponent(`Check out this post on Track Reframe`);

  const shareOptions = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366]",
      icon: <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
      href: `https://api.whatsapp.com/send?text=${title}%20${url}`
    },
    {
      name: "X",
      color: "bg-[#0A0A0F]",
      icon: <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      href: `https://twitter.com/intent/tweet?url=${url}&text=${title}`
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2]",
      icon: <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`
    },
    {
      name: "Reddit",
      color: "bg-[#FF4500]",
      icon: <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25C10.5 12.56 9.94 12 9.25 12zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25C16 12.56 15.44 12 14.75 12zm-5.022 3.713c-.104.1-.104.256 0 .366.326.326.852.544 1.58.64a4.471 4.471 0 0 0 1.385 0c.728-.096 1.254-.314 1.58-.64.104-.11.104-.266 0-.366a.254.254 0 0 0-.36 0l-.014.014c-.2.193-.615.378-1.205.452a3.791 3.791 0 0 1-1.185 0c-.59-.074-1.005-.259-1.205-.452l-.014-.014a.254.254 0 0 0-.36 0z"/></svg>,
      href: `https://reddit.com/submit?url=${url}&title=${title}`
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="font-display font-bold text-lg text-white">Share</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {shareOptions.map((opt) => (
              <a 
                key={opt.name}
                href={opt.href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 min-w-[60px] snap-start group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${opt.color} shadow-lg shadow-black/20 group-hover:scale-105 group-active:scale-95 transition-all border border-white/10`}>
                  {opt.icon}
                </div>
                <span className="text-xs font-medium text-text-muted group-hover:text-white transition-colors">{opt.name}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 pl-4">
            <input 
              type="text" 
              readOnly 
              value={url}
              className="flex-1 bg-transparent text-sm text-text-muted focus:outline-none truncate selection:bg-indigo/30"
            />
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
