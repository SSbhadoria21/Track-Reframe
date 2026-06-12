"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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
  
  // New features state
  const [showOptions, setShowOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
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
      setShowEmojiPicker(false);
      
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

  const handleDelete = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await supabase.from("direct_messages").delete().eq("id", msgId);
    } catch (e) {
      toast.error("Could not delete message");
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear this chat?")) return;
    setMessages([]);
    setShowOptions(false);
    toast.success("Chat cleared");
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

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

        {/* Right side icons / Options Menu */}
        <div className="ml-auto flex items-center gap-1">
           {isSearching ? (
             <div className="relative">
               <input 
                 autoFocus
                 type="text" 
                 value={searchQuery} 
                 onChange={(e) => setSearchQuery(e.target.value)} 
                 placeholder="Search chat..." 
                 className="w-32 md:w-48 bg-black/20 border border-white/10 rounded-full py-1.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-amber/50"
               />
               <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
           ) : (
             <button onClick={() => setIsSearching(true)} className="p-2 text-text-muted hover:text-white transition-colors rounded-full hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </button>
           )}

           <div className="relative">
             <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-text-muted hover:text-white transition-colors rounded-full hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
             </button>
             
             <AnimatePresence>
                {showOptions && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <button onClick={() => { setIsSearching(true); setShowOptions(false); }} className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-white/5 transition-colors">Search</button>
                    <button onClick={handleClearChat} className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors">Clear Chat</button>
                  </motion.div>
                )}
             </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide flex flex-col">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 m-auto">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-sm font-bold text-white">{isSearching ? "No messages found" : `Say hello to ${targetUser.display_name}!`}</p>
            {!isSearching && <p className="text-xs text-text-muted mt-1">This is the start of your direct message history.</p>}
          </div>
        ) : (
          filteredMessages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserProfile?.id;
            const msgDate = new Date(msg.created_at).toDateString();
            const prevMsgDate = i > 0 ? new Date(filteredMessages[i-1].created_at).toDateString() : null;
            const showDateHeader = msgDate !== prevMsgDate;
            
            return (
              <div key={msg.id} className="flex flex-col">
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-surface/80 border border-white/5 rounded-lg text-xs font-medium text-text-muted shadow-sm backdrop-blur-sm">
                      {formatDateHeader(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full group mb-1 relative`}>
                  
                  {/* Delete Button (Hover) */}
                  {isMe && (
                     <button 
                       onClick={() => handleDelete(msg.id)}
                       className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-error/10 text-error hover:bg-error/20 z-10"
                       title="Delete for me"
                     >
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-3 py-2 text-[15px] relative flex flex-col ${
                      isMe 
                        ? 'bg-amber text-[#0A0A0F] rounded-br-sm shadow-sm' 
                        : 'bg-[#1a1a24] text-white border border-white/5 rounded-bl-sm'
                    }`}
                  >
                    <div className="pr-12 pb-3 break-words leading-snug">
                      {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part: string, idx: number) => 
                        part.match(/(https?:\/\/[^\s]+)/g) 
                          ? <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className={`underline ${isMe ? 'hover:text-black/70' : 'hover:text-amber'} break-all transition-colors`}>{part}</a>
                          : part
                      )}
                    </div>
                    <span className={`text-[10px] absolute bottom-1.5 right-2 flex items-center gap-1 font-medium ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/5 bg-surface/80 backdrop-blur-md shrink-0 flex items-center gap-2 relative z-50">
        
        {/* Dummy Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-2 w-72 bg-surface border border-white/10 rounded-2xl shadow-2xl p-3 z-50 flex flex-col"
            >
              <div className="flex gap-4 mb-3 border-b border-white/10 pb-2">
                <button className="text-[11px] font-bold text-amber border-b-2 border-amber pb-1 px-1">Emojis</button>
                <button className="text-[11px] font-bold text-text-muted hover:text-white pb-1 px-1 transition-colors">Stickers</button>
                <button className="text-[11px] font-bold text-text-muted hover:text-white pb-1 px-1 transition-colors">GIFs</button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {["😀","😂","🥰","😎","🥺","😭","🔥","👍","❤️","✨","🎬","🍿","🎥","🏆","⭐","💯"].map(e => (
                  <button key={e} onClick={() => setNewMessage(prev => prev + e)} className="text-xl hover:bg-white/10 rounded p-1 transition-colors">{e}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 transition-colors rounded-full hover:bg-white/5 ${showEmojiPicker ? 'text-amber bg-white/5' : 'text-text-muted hover:text-amber'}`} title="Stickers">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-text-muted hover:text-amber transition-colors rounded-full hover:bg-white/5 hidden sm:flex items-center justify-center" title="GIF">
          <div className="border border-current rounded-[4px] px-1 py-0.5 text-[9px] font-black uppercase tracking-wider">GIF</div>
        </button>
        <button type="button" className="p-2 text-text-muted hover:text-amber transition-colors rounded-full hover:bg-white/5" title="Attach">
          <svg className="w-5 h-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>

        <form onSubmit={handleSend} className="relative flex-1 flex items-center ml-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-black/20 border border-white/10 focus:border-amber/50 rounded-full pl-5 pr-12 py-2.5 text-[15px] text-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-1 w-9 h-9 rounded-full bg-amber hover:bg-amber-hover text-[#0A0A0F] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
