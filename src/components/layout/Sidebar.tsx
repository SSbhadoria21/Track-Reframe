"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ApertureIcon,
  FilmReelIcon,
  CameraIcon,
  ClapperboardIcon,
  TrophyIcon,
  UserIcon,
  BellIcon,
  CoinIcon,
} from "@/components/icons";
import { useSession, signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<{ displayName: string; username: string; initials: string; avatarUrl?: string | null } | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Real stats from DB — initialized to 0
  const [stats, setStats] = useState({ posts: 0, followers: 0, saved: 0, coins: 0, awards: 0 });

  // Fetch real stats from Supabase
  useEffect(() => {
    if (!session?.user) return;
    
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            posts: data.stats.posts || 0,
            followers: data.stats.followers || 0,
            saved: data.stats.saved || 0,
            coins: data.stats.coins || 0,
            awards: data.stats.awards || 0,
          });
        }
      } catch {
        // Keep zeroed stats on error
      }
    };
    fetchStats();
  }, [session]);

  // Listen for save events to update saved count in real-time
  useEffect(() => {
    const handlePostSaved = (e: any) => {
      if (e.detail?.isSaved) {
        setStats((prev) => ({ ...prev, saved: prev.saved + 1 }));
      } else {
        setStats((prev) => ({ ...prev, saved: Math.max(0, prev.saved - 1) }));
      }
    };
    window.addEventListener("postSaved", handlePostSaved);
    return () => window.removeEventListener("postSaved", handlePostSaved);
  }, []);

  // Listen for real-time follower changes
  useEffect(() => {
    let isMounted = true;
    let channel: any;
    const supabase = createClient();

    const initRealtime = async () => {
      if (!session?.user?.email) return;

      // We need the internal ID for the channel, but since we're using NextAuth,
      // we'll fetch the profile to get the correct ID if needed, 
      // or just use the session user id if it's synced.
      const email = session?.user?.email;
      if (!email) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      
      if (!profile || !isMounted) return;

      const channelName = `sidebar_stats:${profile.id}`;
      
      // Clean up any existing channel with this name
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!isMounted) return;

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_follows', filter: `following_id=eq.${profile.id}` },
          async () => {
            if (!isMounted) return;
            // Re-fetch stats when someone follows/unfollows you
            const res = await fetch("/api/user/stats");
            if (res.ok && isMounted) {
              const data = await res.json();
              setStats((prev) => ({ ...prev, followers: data.stats.followers || 0 }));
            }
          }
        )
        .subscribe();
    };

    initRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session]);

  useEffect(() => {
    const fetchUser = async () => {
      const email = session?.user?.email;
      if (!email) return;
      
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, name, username, avatar_url")
        .eq("email", email)
        .single();

      if (profile) {
        const displayName = profile.display_name || profile.name || session?.user?.name || "Creator Profile";
        const username = profile.username || "creator";
        const initials = displayName.substring(0, 2).toUpperCase();
        
        setUserProfile({ 
          displayName, 
          username, 
          initials,
          avatarUrl: profile.avatar_url || session?.user?.image || null 
        });
      } else if (session.user) {
        // Fallback to session data if profile not yet created in DB
        const displayName = session?.user?.name || "Creator Profile";
        const initials = displayName.substring(0, 2).toUpperCase();
        setUserProfile({
          displayName,
          username: "creator",
          initials,
          avatarUrl: session?.user?.image || null
        });
      }
    };
    fetchUser();

    const handleAvatarUpdate = (e: any) => {
      if (typeof e.detail === 'string') {
        setUserProfile(prev => prev ? { ...prev, avatarUrl: e.detail } : null);
      }
    };
    window.addEventListener('updateAvatar', handleAvatarUpdate);
    return () => window.removeEventListener('updateAvatar', handleAvatarUpdate);
  }, [session]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    { name: "Home Feed", href: "/feed", icon: FilmReelIcon },
    { name: "Studio", href: "/studio", icon: CameraIcon },
    { name: "Discover", href: "/discover", icon: ApertureIcon },
    { name: "Community", href: "/community", icon: ClapperboardIcon },
    { name: "Competitions", href: "/competitions", icon: TrophyIcon },
    { name: "My Dashboard", href: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] sticky top-0 h-screen bg-surface border-r border-border-default relative z-50">
      {/* Subtle sprocket hole pattern on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-2 film-strip-border border-0 border-l" />

      {/* Top: Logo */}
      <div className="flex items-center gap-3 p-6">
        <ApertureIcon className="w-7 h-7 text-amber animate-slow-spin" />
        <span className="font-display text-xl font-bold tracking-wide">Track Reframe</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 h-12 px-4 rounded-md transition-colors ${
                    isActive
                      ? "bg-amber/10 text-amber border-l-[3px] border-amber font-medium"
                      : "text-text-secondary hover:bg-elevated/50 hover:text-text-primary"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-amber" : ""}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-6 px-6">
          <div className="h-px bg-border-default w-full" />
        </div>

        <ul className="space-y-1 px-3">
          <li>
            <Link
              href="/notifications"
              className="flex items-center gap-3 h-12 px-4 rounded-md text-text-secondary hover:bg-elevated/50 hover:text-text-primary transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              Notifications
              {/* Only show badge if there are unread notifications */}
            </Link>
          </li>
          <li>
            <div className="flex items-center gap-3 h-12 px-4 rounded-md text-text-secondary cursor-pointer hover:bg-elevated/50 hover:text-text-primary transition-colors">
              <CoinIcon className="w-5 h-5 text-amber" />
              <span className="font-mono text-amber">{stats.coins}</span> Coins
            </div>
          </li>
        </ul>
      </nav>

      {/* Bottom section: Avatar, Metrics, and Logout */}
      <div className="p-4 mt-auto border-t border-border-default flex flex-col gap-3">
        
        {/* Mini Metrics — Real data from DB */}
        <div className="flex justify-between items-center px-2 py-2 bg-elevated/50 rounded-lg border border-border-default">
          <div className="flex flex-col items-center flex-1 cursor-pointer hover:bg-elevated/50 rounded transition-colors py-1">
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Posts</span>
            <span className="text-sm font-bold text-text-primary">{stats.posts}</span>
          </div>
          <div className="w-px h-6 bg-border-default"></div>
          <div 
            onClick={() => setShowFollowers(true)}
            className="flex flex-col items-center flex-1 cursor-pointer hover:bg-elevated/50 rounded transition-colors py-1"
          >
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Followers</span>
            <span className="text-sm font-bold text-text-primary">{stats.followers}</span>
          </div>
          <div className="w-px h-6 bg-border-default"></div>
          <div 
            className="flex flex-col items-center flex-1 transition-colors py-1"
          >
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Awards</span>
            <span className="text-sm font-bold text-amber">{stats.awards}</span>
          </div>
        </div>


        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-elevated/50 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-indigo/20 border border-indigo/40 flex items-center justify-center text-indigo font-bold text-sm shrink-0 overflow-hidden">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userProfile?.initials || "US"
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-primary truncate">{userProfile?.displayName || "Creator Profile"}</span>
            <span className="text-xs text-text-muted truncate">@{userProfile?.username || "settings"}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          suppressHydrationWarning
          className="cursor-pointer w-full py-2 px-3 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      {/* Followers Modal */}
      <AnimatePresence>
        {showFollowers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-elevated border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border-default flex justify-between items-center">
                <h2 className="font-display font-bold text-lg">Your Followers</h2>
                <button onClick={() => setShowFollowers(false)} className="text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {stats.followers === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">No followers yet. Share your work to grow your audience!</p>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">You have {stats.followers} follower(s).</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Modal */}
      <AnimatePresence>
        {showSaved && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-elevated border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border-default flex justify-between items-center">
                <h2 className="font-display font-bold text-lg">Saved Posts</h2>
                <button onClick={() => setShowSaved(false)} className="text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {stats.saved === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">No saved posts yet. Bookmark posts from the feed!</p>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">You have {stats.saved} saved post(s).</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
}
