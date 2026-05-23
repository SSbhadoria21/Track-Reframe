"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ChatPage() {
  const { username } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        // 1. Get current user profile for ID
        const email = session?.user?.email;
        if (email) {
          const { data: profile } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();
          if (profile) setCurrentUserProfile(profile);
        }

        // 2. Get target user by username
        const targetRes = await fetch(`/api/user/profile/${username}`);
        if (!targetRes.ok) throw new Error("User not found");
        const targetData = await targetRes.json();
        setTargetUser(targetData);

        // 3. Get conversation history
        const convRes = await fetch(`/api/messages/${targetData.id}`);
        if (convRes.ok) {
          const convData = await convRes.json();
          setMessages(convData.messages || []);
          setConversationId(convData.conversationId);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load conversation");
        router.push('/messages');
      } finally {
        setLoading(false);
      }
    };

    if (username && session?.user) {
      initChat();
    }
  }, [username, session]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`room:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          // If the message is from the other user, add it to our state
          // (Our own messages are added optimistically)
          if (payload.new.sender_id !== currentUserProfile?.id) {
            setMessages((prev) => [...prev, payload.new]);
            
            // Mark as read immediately since we are in the chat
            supabase
              .from("direct_messages")
              .update({ is_read: true })
              .eq("id", payload.new.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserProfile, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUser || sending) return;

    const contentToSend = newMessage.trim();
    setNewMessage(""); // clear input optimistically
    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          content: contentToSend
        })
      });

      if (!res.ok) throw new Error("Failed to send");
      
      const { message } = await res.json();
      
      // Update local state with our new message
      setMessages(prev => [...prev, message]);
      
      if (!conversationId) {
        setConversationId(message.conversation_id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Message failed to send");
      setNewMessage(contentToSend); // restore input
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!targetUser) return null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] max-w-[900px] mx-auto w-full bg-background border-x border-white/5">
      {/* Header */}
      <div className="h-16 border-b border-white/5 bg-surface/80 backdrop-blur-md px-4 flex items-center gap-3 shrink-0 sticky top-0 z-10">
        <button 
          onClick={() => router.push('/messages')}
          className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-text-muted transition-colors mr-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <Link href={`/creator/${targetUser.username}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-white/5 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0 border border-white/10 group-hover:border-amber/50 transition-colors">
            {targetUser.avatar_url ? (
              <img src={targetUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (targetUser.display_name || "U").charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight group-hover:text-amber transition-colors">
              {targetUser.display_name}
            </h2>
            <p className="text-[10px] text-text-muted">@{targetUser.username}</p>
          </div>
        </Link>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-sm font-bold text-white">Say hello to {targetUser.display_name}!</p>
            <p className="text-xs text-text-muted mt-1">This is the start of your direct message history.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserProfile?.id;
            const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 5 * 60000;
            
            return (
              <div key={msg.id} className="flex flex-col">
                {showTime && (
                  <span className="text-[10px] text-text-muted text-center my-3 block">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe 
                        ? 'bg-amber text-[#0A0A0F] rounded-br-sm shadow-sm' 
                        : 'bg-[#1a1a24] text-white border border-white/5 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </motion.div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-surface/50 backdrop-blur-sm shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#0d0d12] border border-white/10 focus:border-amber/50 rounded-full pl-5 pr-12 py-3 text-sm text-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-2 w-8 h-8 rounded-full bg-amber hover:bg-amber-hover text-[#0A0A0F] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
