"use client";

import { useState, useEffect } from "react";
import { BellIcon, CoinIcon, SearchIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { toast } from "react-hot-toast";

import { useSession } from "next-auth/react";

export function TopBar() {
  const { data: session } = useSession();
  const [coins, setCoins] = useState<number>(0);
  const [userInitials, setUserInitials] = useState("CU");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      
      const existingChannel = supabase.getChannels().find(ch => ch.topic === `realtime:${channelName}`);
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
                  <p className="text-sm font-bold text-white">{newNotif.title}</p>
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

  useEffect(() => {
    const fetchUserData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, name, coins, avatar_url")
        .eq("email", email)
        .single();
      
      if (profile) {
        const displayName = profile.display_name || profile.name || session?.user?.name || "Creator Profile";
        setUserInitials(displayName.substring(0, 2).toUpperCase());
        setCoins(profile.coins || 0);
        setAvatarUrl(profile.avatar_url || session?.user?.image || null);
      } else if (session.user) {
        const displayName = session?.user?.name || "Creator";
        setUserInitials(displayName.substring(0, 2).toUpperCase());
        setAvatarUrl(session?.user?.image || null);
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
    <header className="h-16 border-b border-border-default bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-amber transition-colors" />
          <input
            type="text"
            placeholder="Search films, scripts, or creators..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-amber/50 focus:bg-white/10 transition-all"
            suppressHydrationWarning
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Coins */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/20 rounded-full">
          <CoinIcon className="w-4 h-4 text-amber" />
          <span className="font-mono text-sm text-amber font-bold">{coins}</span>
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
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            userInitials
          )}
        </div>
      </div>
    </header>
  );
}
