"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
              className="bg-surface border border-white/5 rounded-xl p-4 hover:border-amber/30 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-[#0d0d12] flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-white/10 shrink-0">
                {c.otherUser?.avatar_url ? (
                  <img src={c.otherUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (c.otherUser?.display_name || c.otherUser?.username || "U").charAt(0)
                )}
              </div>
              
              <div className="flex-1 min-w-0">
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
