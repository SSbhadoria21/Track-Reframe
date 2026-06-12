"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatIcon } from "@/components/icons";

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  lastMessage: {
    content: string;
    is_read: boolean;
    sender_id: string;
    created_at: string;
  } | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleChatAction = (e: React.MouseEvent, action: string, convId: string) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (action === "delete" && confirm("Delete this conversation?")) {
      setConversations(prev => prev.filter(c => c.id !== convId));
    } else if (action === "clear" && confirm("Clear this conversation?")) {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, lastMessage: null } : c));
    } else if (action === "archive") {
      setConversations(prev => prev.filter(c => c.id !== convId));
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-[900px] mx-auto w-full select-text min-h-[calc(100vh-100px)]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber shrink-0 border border-amber/20">
          <ChatIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Messages</h1>
          <p className="text-xs text-text-muted mt-0.5">Your private conversations</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-surface rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-xl border border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-text-muted">
            <ChatIcon className="w-6 h-6" />
          </div>
          <p className="text-sm text-text-secondary font-bold">No messages yet.</p>
          <p className="text-xs text-text-muted mt-1">Start a conversation from someone's profile!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {conversations.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/messages/${c.otherUser?.username}`)}
              className={`bg-surface border border-white/5 rounded-xl p-4 hover:border-amber/30 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-4 group relative ${activeMenu === c.id ? 'z-50' : 'z-0'}`}
            >
              <div className="w-12 h-12 rounded-full bg-[#0d0d12] flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-white/10 shrink-0">
                {c.otherUser?.avatar_url ? (
                  <img src={c.otherUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (c.otherUser?.display_name || c.otherUser?.username || "U").charAt(0)
                )}
              </div>
              
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-sm text-white truncate pr-4 group-hover:text-amber transition-colors">
                    {c.otherUser?.display_name || c.otherUser?.username}
                  </h3>
                  <span className="text-[10px] text-text-muted shrink-0">
                    {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <p className={`text-xs truncate ${c.lastMessage && !c.lastMessage.is_read && c.lastMessage.sender_id === c.otherUser?.id ? 'text-white font-semibold' : 'text-text-secondary'}`}>
                  {c.lastMessage ? c.lastMessage.content : "Start chatting..."}
                </p>
              </div>
              
              {c.lastMessage && !c.lastMessage.is_read && c.lastMessage.sender_id === c.otherUser?.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-amber shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}

              {/* Chat Options Button */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === c.id ? null : c.id); }}
                  className={`p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-white transition-colors ${activeMenu === c.id ? 'opacity-100 bg-white/10 text-white' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
                
                <AnimatePresence>
                  {activeMenu === c.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-8 top-0 w-36 bg-elevated border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1 origin-top-right"
                    >
                      <button onClick={(e) => handleChatAction(e, "archive", c.id)} className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-white/5 transition-colors">Archive</button>
                      <button onClick={(e) => handleChatAction(e, "clear", c.id)} className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-white/5 transition-colors">Clear Chat</button>
                      <button onClick={(e) => handleChatAction(e, "delete", c.id)} className="w-full text-left px-4 py-2 text-xs text-error hover:bg-error/10 transition-colors">Delete Chat</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
