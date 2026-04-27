"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BellIcon, 
  HeartIcon, 
  MessageSquareIcon, 
  UserPlusIcon, 
  TrophyIcon, 
  SettingsIcon, 
  UsersIcon,
  XIcon,
  CheckCircleIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

type NotificationType = 'like' | 'comment' | 'follow' | 'competition' | 'system' | 'community';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  actor?: {
    display_name: string;
    avatar_url: string;
  };
}

import { useSession } from "next-auth/react";

export function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const tabs = [
    { id: 'all', label: 'All', icon: BellIcon },
    { id: 'like', label: 'Likes', icon: HeartIcon },
    { id: 'comment', label: 'Comments', icon: MessageSquareIcon },
    { id: 'follow', label: 'Follows', icon: UserPlusIcon },
    { id: 'community', label: 'Community', icon: UsersIcon },
    { id: 'competition', label: 'Competitions', icon: TrophyIcon },
    { id: 'system', label: 'System', icon: SettingsIcon },
  ];
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, session]);

  const fetchNotifications = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    
    const email = session?.user?.email;
    if (!email) return;

    // Fetch profile to get ID
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
      
    if (!profile) return;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const email = session?.user?.email;
    if (!email) return;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
      
    if (!profile) return;

    // We mark them as read in the DB, but remove them from the UI list for the "Clear" effect
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    
    setNotifications([]); // This will trigger the exit animations
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-14 w-[400px] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[101] flex flex-col overflow-hidden ring-1 ring-black/50"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide uppercase">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-amber text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={markAllAsRead}
                  className="text-[11px] text-amber hover:text-amber/80 transition-colors font-bold uppercase tracking-wider"
                >
                  Clear All
                </button>
                <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md transition-colors">
                  <XIcon className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-3 border-b border-white/5 bg-black/20 overflow-x-auto flex items-center gap-1.5 no-scrollbar scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all uppercase tracking-tight ${
                    activeTab === tab.id 
                      ? 'bg-amber text-black shadow-lg shadow-amber/10' 
                      : 'bg-white/5 text-text-muted hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[450px] p-2 space-y-1 no-scrollbar scrollbar-hide min-h-[300px]">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div key="loading" className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-6 h-6 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Loading</p>
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className={`p-3 rounded-xl transition-all cursor-pointer group flex gap-3 overflow-hidden ${
                        notification.is_read 
                          ? 'opacity-60 hover:opacity-100' 
                          : 'bg-white/5 border border-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notification.type === 'like' ? 'bg-error/20 text-error' :
                      notification.type === 'comment' ? 'bg-blue-500/20 text-blue-400' :
                      notification.type === 'follow' ? 'bg-purple-500/20 text-purple-400' :
                      notification.type === 'community' ? 'bg-amber/20 text-amber' :
                      'bg-white/10 text-text-muted'
                    }`}>
                      {notification.type === 'like' && <HeartIcon className="w-4 h-4 fill-current" />}
                      {notification.type === 'comment' && <MessageSquareIcon className="w-4 h-4" />}
                      {notification.type === 'follow' && <UserPlusIcon className="w-4 h-4" />}
                      {notification.type === 'community' && <UsersIcon className="w-4 h-4" />}
                      {notification.type === 'competition' && <TrophyIcon className="w-4 h-4" />}
                      {notification.type === 'system' && <SettingsIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs font-bold leading-tight ${notification.is_read ? 'text-text-muted' : 'text-white'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[9px] text-text-muted font-mono uppercase">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-snug">
                        {notification.content}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-1.5 h-1.5 bg-amber rounded-full mt-1.5 shadow-lg shadow-amber/50" />
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                  <BellIcon className="w-8 h-8 text-white/10 mb-3" />
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Inbox Empty</p>
                </div>
              )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 bg-white/2 border-t border-white/5">
              <button 
                onClick={() => window.location.href = '/notifications'}
                className="w-full py-2 hover:bg-white/5 text-[10px] font-bold text-text-muted hover:text-white uppercase tracking-widest transition-all"
              >
                View Full History
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
