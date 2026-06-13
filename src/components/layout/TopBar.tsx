"use client";

import { useState, useEffect } from "react";
import { BellIcon, CoinIcon, SearchIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { toast } from "react-hot-toast";

import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function TopBar() {
  const { data: session } = useSession();
  const [coins, setCoins] = useState<number>(0);
  const [userInitials, setUserInitials] = useState("CU");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownType, setSearchDropdownType] = useState<"users" | "tags" | null>(null);
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const router = useRouter();

  // Search logic
  useEffect(() => {
    if (!searchQuery) {
      setSearchDropdownType(null);
      setSearchOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      if (searchQuery.startsWith("@")) {
        setSearchDropdownType("users");
        const q = searchQuery.substring(1);
        fetch(`/api/search/users?q=${q}`).then(res => res.json()).then(data => setSearchOptions(data.users || []));
      } else if (searchQuery.startsWith("#")) {
        setSearchDropdownType("tags");
        const q = searchQuery.substring(1);
        fetch(`/api/search/tags?q=${q}`).then(res => res.json()).then(data => setSearchOptions(data.tags || []));
      } else {
        setSearchDropdownType(null);
        setSearchOptions([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;

    let isMounted = true;
    let channel: any;
    const supabase = createClient();

    const setupNotifications = async () => {
      // Fetch profile to get ID
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
        
      if (!profile || !isMounted) return;

      // 1. Initial Unread Count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      
      if (isMounted) {
        setUnreadCount(count || 0);
      }

      // 2. Real-time Listener
      const channelName = `topbar_notifs:${profile.id}`;
      
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!isMounted) return;

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          },
          (payload: any) => {
            if (!isMounted) return;
            const newNotif = payload.new as any;
            setUnreadCount(prev => prev + 1);
            
            toast((t) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center">
                  <BellIcon className="w-4 h-4 text-amber" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{newNotif.title}</p>
                  <p className="text-xs text-text-muted line-clamp-1">{newNotif.content}</p>
                </div>
              </div>
            ), { icon: null });
          }
        )
        .subscribe();
    };

    setupNotifications();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session]);

  const [bio, setBio] = useState("No bio added yet.");
  const [designation, setDesignation] = useState("Indie Filmmaker");
  const [userStats, setUserStats] = useState({ films: 0, followers: 0 });

  useEffect(() => {
    const fetchUserData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, name, coins, avatar_url, bio, roles")
        .eq("email", email)
        .single();
      
      let followers = 0;
      let films = 0;
      try {
        const statsRes = await fetch("/api/user/stats");
        if (statsRes.ok) {
           const data = await statsRes.json();
           followers = data.stats?.followers || 0;
           films = data.stats?.films || 0;
        }
      } catch (e) {}
      
      if (profile) {
        const displayName = profile.display_name || profile.name || session?.user?.name || "Creator Profile";
        setUserInitials(displayName.substring(0, 2).toUpperCase());
        setCoins(profile.coins || 0);
        setAvatarUrl(profile.avatar_url || session?.user?.image || null);
        setBio(profile.bio || "No bio added yet.");
        setDesignation(profile.roles?.[0] || "Indie Filmmaker");
        setUserStats({ films, followers });
      } else if (session.user) {
        const displayName = session?.user?.name || "Creator";
        setUserInitials(displayName.substring(0, 2).toUpperCase());
        setAvatarUrl(session?.user?.image || null);
        setUserStats({ films, followers });
      }
    };
    fetchUserData();

    const handleCoinUpdate = (e: any) => {
      if (typeof e.detail === 'number') setCoins(e.detail);
    };
    
    const handleAvatarUpdate = (e: any) => {
      if (typeof e.detail === 'string') setAvatarUrl(e.detail);
    };
    
    window.addEventListener('updateCoins', handleCoinUpdate);
    window.addEventListener('updateAvatar', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('updateCoins', handleCoinUpdate);
      window.removeEventListener('updateAvatar', handleAvatarUpdate);
    };
  }, [session]);

  return (
    <header className="h-16 border-b border-border-default bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 gap-2">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-amber transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search films, scripts, or creators..."
            className="w-full bg-black/5 dark:bg-white/5 border border-border-default rounded-full py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-amber/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all placeholder:text-text-muted/50"
            suppressHydrationWarning
          />
          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {searchDropdownType && searchOptions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute z-50 w-full mt-2 bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
              >
                {searchDropdownType === "users" && searchOptions.map((user) => (
                  <div 
                    key={user.id}
                    onClick={() => { setSearchQuery(""); router.push(`/creator/${user.username}`); }}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-indigo">{user.display_name?.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary">{user.display_name}</div>
                      <div className="text-xs text-text-muted">@{user.username}</div>
                    </div>
                  </div>
                ))}
                {searchDropdownType === "tags" && searchOptions.map((tag) => (
                  <div 
                    key={tag.tag}
                    onClick={() => { setSearchQuery(""); router.push(`/discover/tags?tag=${tag.tag.replace('#', '')}`); }}
                    className="flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="text-sm font-bold text-amber">{tag.tag}</div>
                    <div className="text-xs text-text-muted">{tag.count} posts</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Theme Toggle */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-amber/10 border border-amber/20 rounded-full">
          <CoinIcon className="w-4 h-4 text-amber" />
          <span className="font-mono text-xs sm:text-sm text-amber font-bold">{coins}</span>
        </div>

        {/* Notifications */}
        <button 
          onClick={() => {
            setShowNotifications(true);
            setUnreadCount(0); // Optimistic clear
          }}
          className="p-2 text-text-muted hover:text-text-primary transition-colors relative"
          suppressHydrationWarning
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber text-black text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <NotificationCenter 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />

        {/* User Avatar */}
        <button 
          onClick={() => setIsProfileDrawerOpen(true)}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg overflow-hidden hover:scale-105 transition-transform"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            userInitials
          )}
        </button>
      </div>

      {/* Profile Drawer */}
      <AnimatePresence>
        {isProfileDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileDrawerOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-border-default z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border-default flex justify-between items-center bg-elevated/50">
                 <h2 className="font-display font-bold text-lg">Profile</h2>
                 <button onClick={() => setIsProfileDrawerOpen(false)} className="text-text-muted hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-6 flex flex-col items-center border-b border-border-default">
                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-amber p-1 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden mb-4">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      userInitials
                    )}
                 </div>
                 <h3 className="text-xl font-bold text-text-primary text-center">{session?.user?.name || "Creator"}</h3>
                 <p className="text-amber text-sm font-medium mb-2">{designation}</p>
                 <p className="text-text-secondary text-xs text-center">{bio}</p>
                 
                 <div className="flex gap-4 mt-6 text-center">
                    <div>
                      <div className="font-bold text-lg text-text-primary">{userStats.films}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">Films</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-text-primary">{userStats.followers}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">Followers</div>
                    </div>
                 </div>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                 <Link href="/" onClick={() => setIsProfileDrawerOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-3">
                   <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                   Go to Home
                 </Link>
                 <Link href="/dashboard" onClick={() => setIsProfileDrawerOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-3">
                   <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                   My Dashboard
                 </Link>
              </div>

              <div className="p-4 border-t border-border-default">
                 {session ? (
                   <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full px-4 py-3 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     Log Out
                   </button>
                 ) : (
                   <Link href="/login" onClick={() => setIsProfileDrawerOpen(false)} className="w-full px-4 py-3 rounded-xl bg-amber text-black hover:scale-105 transition-transform text-sm font-bold flex items-center justify-center">
                     Log In
                   </Link>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
