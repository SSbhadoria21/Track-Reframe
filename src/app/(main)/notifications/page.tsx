"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { 
  HeartIcon, 
  MessageSquareIcon, 
  UserPlusIcon, 
  TrophyIcon, 
  SettingsIcon, 
  UsersIcon 
} from "lucide-react";

const FILTERS = ["All", "Likes", "Comments", "Follows", "Community", "Competitions", "System"];

const typeIcons: Record<string, any> = {
  like: HeartIcon,
  comment: MessageSquareIcon,
  follow: UserPlusIcon,
  community: UsersIcon,
  competition: TrophyIcon,
  system: SettingsIcon,
};

const typeColors: Record<string, string> = {
  like: "text-error",
  comment: "text-blue-400",
  follow: "text-purple-400",
  community: "text-amber",
  competition: "text-amber",
  system: "text-text-muted",
};

import { useSession } from "next-auth/react";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [activeFilter, setActiveFilter] = useState("All");
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!session?.user?.email) return;
    
    let isMounted = true;
    let channel: any;
    const supabase = createClient();

    fetchNotifications();

    // Real-time subscription
    const setupRealtime = async () => {
      const email = session?.user?.email;
      if (!email || !isMounted) return;

      // Fetch profile to get ID
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
        
      if (!profile || !isMounted) return;

      const channelName = `page_notifs:${profile.id}`;
      
      // Clean up any existing channel with this name to avoid "callbacks after subscribe" error
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
          () => {
            if (isMounted) fetchNotifications();
          }
        )
        .subscribe();
    };

    setupRealtime();
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session]);

  const fetchNotifications = async () => {
    if (!session?.user?.email) return;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", session?.user?.email)
      .single();
      
    if (!profile) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    setNotifs(data || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!session?.user?.email) return;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", session?.user?.email)
      .single();
      
    if (!profile) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id);
    
    setNotifs(notifs.map((n) => ({ ...n, is_read: true })));
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifs(notifs.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const filtered = activeFilter === "All"
    ? notifs
    : notifs.filter((n) => n.type.toLowerCase() === activeFilter.toLowerCase().replace("s", ""));

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto overflow-y-auto scrollbar-hide pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BellIcon className="w-8 h-8 text-amber" />
          <h1 className="font-display text-4xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-amber text-black text-sm font-bold px-3 py-0.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <button 
          onClick={markAllRead} 
          className="text-sm text-amber font-bold hover:text-amber/80 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 p-1">
        {FILTERS.map((f) => (
          <button 
            key={f} 
            onClick={() => setActiveFilter(f)} 
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
              activeFilter === f 
                ? "bg-amber text-black border-amber shadow-lg shadow-amber/10" 
                : "bg-surface border-white/5 text-text-secondary hover:border-white/10 hover:bg-elevated"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
            <p className="text-sm text-text-muted">Loading your notifications...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((n, i) => {
            const Icon = typeIcons[n.type] || BellIcon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => markAsRead(n.id)}
                className={`flex items-start gap-4 px-6 py-5 rounded-2xl cursor-pointer transition-all border ${
                  n.is_read 
                    ? "bg-surface/40 border-white/5 hover:bg-surface/60" 
                    : "bg-elevated border-amber/10 hover:border-amber/20 shadow-xl shadow-amber/5"
                }`}
              >
                <div className={`p-2.5 rounded-xl bg-white/5 ${typeColors[n.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-base ${n.is_read ? "text-text-secondary" : "text-white"}`}>
                      {n.title}
                    </span>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber shrink-0" />}
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{n.content}</p>
                </div>
                <span className="text-[11px] font-mono text-text-muted uppercase tracking-tighter whitespace-nowrap mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <BellIcon className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No notifications found</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Try switching your filter or come back later for new updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
