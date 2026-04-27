"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SendIcon, 
  FilmReelIcon, 
  SmileIcon, 
  PaperclipIcon, 
  SettingsIcon, 
  UserPlusIcon,
  XIcon
} from "@/components/icons";
import { MessageItem } from "./MessageItem";
import { JoinRoomOverlay } from "./JoinRoomOverlay";
import { AdminSettingsModal } from "./AdminSettingsModal";
import { CommunityInfoModal } from "./CommunityInfoModal";

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  type: string;
  content: string;
  media_url?: string;
  og_data?: any;
  created_at: string;
  users?: any; 
}

import { useSession } from "next-auth/react";

export function ChatArea({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showCommunityInfo, setShowCommunityInfo] = useState(false);
  const [myMembershipId, setMyMembershipId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<string, any>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
    const channels = subscribeToRealtime();
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [roomId, session]); // Re-fetch when session changes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialData = async () => {
    setLoading(true);
    setSendError(null);
    try {
      const email = session?.user?.email;
      if (!email) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      
      const activeUserId = profile?.id || (session?.user as any)?.id;
      setCurrentUserId(activeUserId);

      if (profile) {
        setCurrentUserProfile(profile);
        setUserCache(prev => ({ ...prev, [activeUserId]: profile }));
      } else if (session.user) {
        const fallbackProfile = {
          username: "creator",
          display_name: session?.user?.name || "Creator",
          avatar_url: session?.user?.image,
        };
        setCurrentUserProfile(fallbackProfile);
        setUserCache(prev => ({ ...prev, [activeUserId]: fallbackProfile }));
      }

      const { data: room, error: roomError } = await supabase
        .from("communities")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();
      
      if (!room || roomError) {
        console.warn("Room not found, redirecting...");
        window.location.href = "/community";
        return;
      }
      setRoomInfo(room);

      if (activeUserId) {
        const { data: member } = await supabase
          .from("community_members")
          .select("id, role")
          .eq("room_id", roomId)
          .eq("user_id", activeUserId)
          .maybeSingle();
        
        setIsMember(!!member);
        if (member) {
          setIsAdmin(member.role === 'admin' || member.role === 'creator');
          setMyMembershipId(member.id);
        }
      }

      const { data: rawMessages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      
      if (msgError) throw msgError;

      if (rawMessages) {
        setMessages(rawMessages);
        const userIds = [...new Set(rawMessages.map((m: any) => m.user_id))] as string[];
        fetchProfilesBatch(userIds);
      }
    } catch (error: any) {
      console.error("Failed to load chat data:", error);
    } finally {
      setLoading(false);
    }
  };



  const fetchProfilesBatch = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const { data } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);
    
    if (data) {
      const newCache = { ...userCache };
      data.forEach((p: any) => { newCache[p.id] = p; });
      setUserCache(newCache);
    }
  };

  const subscribeToRealtime = () => {
    if (!roomId) return [];

    // 1. Message Channel
    const messageChannel = supabase
      .channel(`room_messages:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // 1. Check if ID already exists
            if (prev.find(m => m.id === newMessage.id)) return prev;

            // 2. Check for matching optimistic message (same content, same user, within 5 seconds)
            const now = new Date(newMessage.created_at).getTime();
            const optimisticIndex = prev.findIndex(m => 
              m.user_id === newMessage.user_id && 
              m.content === newMessage.content && 
              (m.id.length < 20) // Temp IDs are short random strings
            );

            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = newMessage;
              return updated;
            }

            return [...prev, newMessage];
          });
          if (!userCache[newMessage.user_id]) {
             fetchProfilesBatch([newMessage.user_id]);
          }
        }
      )
      .subscribe();

    // 2. Room Update/Delete Channel
    const roomChannel = supabase
      .channel(`room_updates:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "communities", filter: `id=eq.${roomId}` },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            // Redirect to community home if the room is deleted
            window.location.href = "/community";
          } else if (payload.eventType === "UPDATE") {
            setRoomInfo(payload.new);
          }
        }
      )
      .subscribe();

    return [messageChannel, roomChannel];
  };

  // 3. Separate Presence Effect to handle async currentUserId
  useEffect(() => {
    if (!roomId || !currentUserId || !currentUserProfile) return;

    const presenceChannel = supabase.channel(`room_live:${roomId}`, {
      config: { presence: { key: currentUserId } }
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat().map((p: any) => p.user);
        setOnlineUsers(users.filter(Boolean));
      })
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { username, isTyping } = payload.payload;
        setTypingUsers((prev) => {
          if (isTyping) {
            return prev.includes(username) ? prev : [...prev, username];
          } else {
            return prev.filter((u) => u !== username);
          }
        });
      })
      .on("broadcast", { event: "kick" }, (payload: any) => {
        if (payload.payload.userId === currentUserId) {
           window.location.href = "/community";
        }
      })
      .on("postgres_changes", { 
        event: "DELETE", 
        schema: "public", 
        table: "community_members", 
        filter: `room_id=eq.${roomId}` 
      }, async () => {
        console.log("[Membership] Change detected, checking status...");
        if (!currentUserId) return;
        
        // Proactively check if we are still a member
        const { data, error } = await supabase
          .from("community_members")
          .select("id")
          .eq("room_id", roomId)
          .eq("user_id", currentUserId)
          .maybeSingle();
        
        if (!data || error) {
          console.log("[Membership] No longer a member. Redirecting...");
          window.location.href = "/community";
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user: {
              id: currentUserId,
              username: currentUserProfile.username,
              display_name: currentUserProfile.display_name,
              avatar_url: currentUserProfile.avatar_url
            }
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, currentUserId, currentUserProfile]);

  const handleTyping = () => {
    if (!currentUserId || !currentUserProfile) return;

    supabase.channel(`room_live:${roomId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { username: currentUserProfile.display_name, isTyping: true }
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`room_live:${roomId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { username: currentUserProfile.display_name, isTyping: false }
      });
    }, 3000);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId) return;
    
    const content = input.trim();
    const tempId = Math.random().toString();
    const optimisticMsg: Message = {
      id: tempId,
      room_id: roomId,
      user_id: currentUserId,
      content: content,
      type: "text",
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInput("");
    setSendError(null);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    supabase.channel(`room_live:${roomId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { username: currentUserProfile.display_name, isTyping: false }
    });

    try {
      // Pre-check: Ensure room still exists to avoid foreign key errors
      const { data: roomCheck } = await supabase
        .from("communities")
        .select("id")
        .eq("id", roomId)
        .maybeSingle();
      
      if (!roomCheck) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setSendError("This room has been deleted or is no longer accessible.");
        return;
      }

      const { error } = await supabase
        .from("messages")
        .insert({
          room_id: roomId,
          user_id: currentUserId,
          content: content,
          type: "text"
        });

      if (error) {
         setMessages(prev => prev.filter(m => m.id !== tempId));
         setSendError("Database rejected message: " + error.message);
         setInput(content);
      }
    } catch (error: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setSendError("Network failed: " + error.message);
      setInput(content);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    const filePath = `${roomId}/${Math.random()}.${file.name.split('.').pop()}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: currentUserId,
        content: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        media_url: publicUrl
      });
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0F]">
        <div className="w-10 h-10 border-4 border-amber/20 border-t-amber rounded-full animate-spin" />
      </div>
    );
  }

  const shouldShowJoinOverlay = !isMember && (roomInfo?.require_approval || roomInfo?.is_private);

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0F] relative overflow-hidden">
      {/* Room Header */}
      <header className="h-16 border-b border-white/5 bg-surface/50 backdrop-blur-lg flex items-center justify-between px-6 shrink-0 z-20">
        <div 
          onClick={() => setShowCommunityInfo(true)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-amber transition-all">
            {roomInfo?.cover_url ? (
              <img src={roomInfo.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <FilmReelIcon className="w-5 h-5 text-amber" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-white text-base tracking-tight">{roomInfo?.name || "Production Room"}</h1>
              <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-text-muted uppercase border border-white/5">
                {roomInfo?.member_count || 0} Members
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.length > 0 ? 'bg-success animate-pulse' : 'bg-white/20'}`} />
              <span className="text-[10px] text-success font-bold uppercase tracking-widest">
                {onlineUsers.length} online
              </span>
              {typingUsers.length > 0 && (
                <span className="text-[10px] text-amber font-medium italic animate-pulse ml-2">
                  {typingUsers[0]} {typingUsers.length > 1 ? `and ${typingUsers.length - 1} others` : ''} typing...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={() => setShowAdminSettings(true)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-all"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div className="flex flex-col items-center justify-center py-12 text-center border-b border-white/5 mb-8">
          <div className="w-16 h-16 rounded-[24px] bg-amber/5 border border-amber/20 flex items-center justify-center mb-4">
            <FilmReelIcon className="w-8 h-8 text-amber" />
          </div>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">The Set is Ready</h2>
        </div>

        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            message={{ ...msg, users: userCache[msg.user_id] }} 
            isOwn={msg.user_id === currentUserId}
          />
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-surface/50 backdrop-blur-xl border-t border-white/5 relative z-10">
        {sendError && (
          <div className="max-w-4xl mx-auto mb-3 px-4 py-2 bg-error/10 border border-error/20 rounded-xl text-[11px] font-bold text-error flex items-center justify-between">
            <span>{sendError}</span>
            <button onClick={() => setSendError(null)}><XIcon className="w-3 h-3" /></button>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-black/40 border border-white/10 rounded-[24px] p-2 pr-3">
          <div className="flex pb-1 pl-2">
            <label className="w-10 h-10 rounded-full text-text-muted hover:text-amber transition-all flex items-center justify-center cursor-pointer">
              <PaperclipIcon className="w-5 h-5" />
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <textarea 
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Message production crew..."
            className="flex-1 bg-transparent border-none text-sm text-white py-3 focus:outline-none resize-none max-h-32 scrollbar-hide"
            rows={1}
          />

          <button 
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-2xl bg-amber text-black flex items-center justify-center shadow-lg shadow-amber/20"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {shouldShowJoinOverlay && <JoinRoomOverlay roomInfo={roomInfo} onSuccess={() => fetchInitialData()} />}
      <AdminSettingsModal isOpen={showAdminSettings} onClose={() => setShowAdminSettings(false)} roomInfo={roomInfo} onUpdate={(updated) => setRoomInfo(updated)} />
      <CommunityInfoModal 
        isOpen={showCommunityInfo} 
        onClose={() => setShowCommunityInfo(false)} 
        roomInfo={roomInfo} 
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onUpdate={fetchInitialData}
      />
    </div>
  );
}
