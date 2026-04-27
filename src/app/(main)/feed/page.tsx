"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FilmReelIcon, CameraIcon } from "@/components/icons";
import { FeedPost } from "@/components/feed/FeedPost";
import { PostComposer } from "@/components/feed/PostComposer";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

import { useSession } from "next-auth/react";

export default function FeedPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get current authenticated user
  useEffect(() => {
    const getUser = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const supabase = createClient();
      // Fetch user profile from public.users table
      const { data: profile } = await supabase
        .from("users")
        .select("id, display_name, username, avatar_url")
        .eq("email", email)
        .single();
      
      if (profile) {
        setCurrentUser(profile);
      } else if (session.user) {
        setCurrentUser({
          id: (session?.user as any)?.id,
          display_name: session?.user?.name || "Creator",
          username: "creator",
          avatar_url: session?.user?.image,
        });
      }
    };
    getUser();
  }, [session]);

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) {
        console.error("Failed to fetch posts:", res.status);
        return;
      }
      const { posts: data } = await res.json();
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Fetch failed");
      const { posts: data } = await res.json();
      
      const hasNew = data.length > 0 && (posts.length === 0 || data[0].id !== posts[0]?.id);
      
      if (hasNew) {
        toast.success("New masterpieces found!", {
          style: {
            background: "#111118",
            color: "#fff",
            border: "1px solid rgba(245, 166, 35, 0.2)",
            fontSize: "14px",
            fontWeight: "bold",
          },
          icon: "🎬",
        });
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast("You're up to date!", {
          style: {
            background: "#111118",
            color: "#9CA3AF",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            fontSize: "14px",
          },
          icon: "✅",
        });
      }
      
      setPosts(data || []);
    } catch (err) {
      console.error("Error refreshing feed:", err);
      toast.error("Failed to sync with the studio");
    } finally {
      setRefreshing(false);
    }
  };

  // When a new post is created, prepend it to the feed
  const handlePostCreated = (newPost: any) => {
    const author = newPost.author;
    const mapped = {
      ...newPost,
      name: author?.display_name || currentUser?.display_name || "You",
      username: author?.username || currentUser?.username || "creator",
      initials: (author?.display_name || currentUser?.display_name || "Y").substring(0, 2).toUpperCase(),
      time: "Just now",
      likes: 0,
      comments: 0,
      reposts: 0,
      role: "Creator",
    };
    setPosts((prev) => [mapped, ...prev]);
  };

  // Delete a post
  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts?id=${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(`Delete failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Network error while deleting post.");
    }
  };

  // Update a post
  const handleUpdate = async (postId: string, content: string) => {
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, content }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content } : p));
      }
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const userInitials = currentUser
    ? (currentUser.display_name || currentUser.username || "U").substring(0, 2).toUpperCase()
    : "...";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Feed Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-white/5">
        <h1 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FilmReelIcon className="w-5 h-5 text-amber" />
          The Main Feed
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            suppressHydrationWarning
            className="p-2 rounded-full hover:bg-white/5 text-text-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Feed Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        <div className="max-w-[640px] mx-auto py-6 px-4 flex flex-col gap-6">
          {/* Post Composer — only show if logged in */}
          {currentUser && (
            <PostComposer
              userInitials={userInitials}
              userName={currentUser.display_name || currentUser.username}
              onPostCreated={handlePostCreated}
            />
          )}

          {/* Posts Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-amber border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-muted">Loading your cinematic universe...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-elevated/50 border border-white/5 rounded-2xl">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <FilmReelIcon className="w-10 h-10 text-text-muted/40" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Silence on the Set</h2>
              <p className="text-sm text-text-muted max-w-[280px] mb-4">
                The feed is currently empty. Be the first to share a masterpiece!
              </p>
              <p className="text-xs text-text-muted/60">Use the composer above to create your first post ↑</p>
            </div>
          ) : (
            posts.map((post) => {
              const author = post.author;
              const isOwner = currentUser?.id === (author?.id || post.user_id);

              return (
                <FeedPost
                  key={post.id}
                  currentUser={currentUser ? {
                    id: currentUser.id,
                    username: currentUser.username,
                    initials: userInitials,
                  } : undefined}
                  onDelete={() => handleDelete(post.id)}
                  onEdit={(id, content) => handleUpdate(id, content)}
                  post={{
                    ...post,
                    name: author?.display_name || post.name || "Anonymous",
                    username: author?.username || post.username || "creator",
                    initials: (author?.display_name || post.name || "A").substring(0, 2).toUpperCase(),
                    time: post.time || formatTime(post.created_at),
                    likes: post.like_count || post.likes || 0,
                    comments: post.comment_count || post.comments || 0,
                    reposts: post.repost_count || post.reposts || 0,
                    role: "Creator",
                  }}
                />
              );
            })
          )}

          {!loading && posts.length > 0 && (
            <div className="py-10 text-center">
              <div className="inline-block w-2 h-2 rounded-full bg-white/20 animate-pulse mb-2" />
              <p className="text-xs text-text-muted italic">You&apos;ve reached the end of the credits.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Bar (Floating for mobile) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="w-14 h-14 rounded-full bg-amber text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
        >
          <CameraIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// Helper to format timestamps
function formatTime(dateStr: string | null): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
