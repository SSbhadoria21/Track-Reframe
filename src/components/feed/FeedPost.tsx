"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
  const [editContent, setEditContent] = useState(post.content);

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
        // Only notify sidebar if WE are the ones being followed (not applicable here usually)
        // but we keep the event for local UI consistency if needed.
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
    <div className={`bg-surface border rounded-2xl p-5 flex flex-col gap-4 relative transition-colors hover:bg-elevated ${post.isCompetition ? 'border-l-2 border-l-amber border-y-border-default border-r-border-default glow-amber' : 'border-border-default'}`}>
      
      {post.isCompetition && (
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
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[80px] bg-background border border-amber/50 rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-amber transition-colors resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsEditing(false); setEditContent(post.content); }} className="px-3 py-1.5 rounded-md hover:bg-elevated text-xs font-medium text-text-muted transition-colors">Cancel</button>
            <button onClick={() => { onEdit?.(post.id, editContent); setIsEditing(false); }} className="px-3 py-1.5 rounded-md bg-amber/20 text-amber hover:bg-amber/30 text-xs font-bold transition-colors">Save Changes</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary leading-relaxed">{post.content}</p>
      )}

      {/* COMPETITION APPLY BUTTON */}
      {post.competition_id && !post.is_competition_entry && (
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
        <div className="flex items-center gap-4">
          {/* Like — persisted */}
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? "text-amber" : "text-text-muted hover:text-white"}`}>
            <motion.svg animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.4, ease: "easeInOut" }}
              className={`w-5 h-5 ${liked ? "fill-amber" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </motion.svg>
            {likeCount}
          </button>

          {/* Comment */}
          <button onClick={handleToggleComments} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showComments ? "text-white" : "text-text-muted hover:text-white"}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            {commentCount}
          </button>
        </div>

        {/* Bookmark — persisted */}
        <button onClick={handleSave} className={`p-2 transition-colors flex items-center gap-1.5 text-xs font-medium ${saved ? "text-amber" : "text-text-muted hover:text-white"}`}>
          <svg className={`w-5 h-5 ${saved ? "fill-amber" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          {saved ? "Saved" : "Save"}
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
    </div>
  );
}
