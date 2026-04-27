"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  XIcon, 
  UsersIcon, 
  ShieldCheckIcon, 
  UserMinusIcon, 
  CrownIcon,
  LinkIcon,
  CopyIcon,
  CheckIcon,
  LogOutIcon
} from "@/components/icons";

interface Member {
  id: string;
  role: string;
  user_id: string;
  users: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface CommunityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomInfo: any;
  currentUserId: string | null;
  isAdmin: boolean;
  onUpdate?: () => void;
}

export function CommunityInfoModal({ 
  isOpen, 
  onClose, 
  roomInfo, 
  currentUserId, 
  isAdmin,
  onUpdate 
}: CommunityInfoModalProps) {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && roomInfo?.id) {
      fetchMembers();
    }
  }, [isOpen, roomInfo?.id]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/members?roomId=${roomInfo.id}`);
      const data = await res.json();
      console.log("Member API Response:", data);
      if (res.ok) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("Failed to fetch members", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (roomInfo?.invite_code) {
      navigator.clipboard.writeText(roomInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/community/members?roomId=${roomInfo.id}&userId=${userId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        // Broadcast the kick event before updating local state
        const kickChannel = supabase.channel(`room_live:${roomInfo.id}`);
        kickChannel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await kickChannel.send({
              type: 'broadcast',
              event: 'kick',
              payload: { userId }
            });
            // We don't remove the channel immediately to ensure delivery
            setTimeout(() => supabase.removeChannel(kickChannel), 2000);
          }
        });

        setMembers(prev => prev.filter(m => m.user_id !== userId));
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      alert("Connection error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-full bg-[#0A0A0F] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-surface/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                 <button onClick={onClose} className="p-2 -ml-2 text-text-muted hover:text-white transition-all">
                    <XIcon className="w-5 h-5" />
                 </button>
                 <h2 className="font-display font-bold text-white uppercase tracking-wider text-sm">Group Info</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Cover & Title Section */}
              <div className="relative h-64 w-full bg-amber/5">
                {roomInfo?.cover_url ? (
                  <img src={roomInfo.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UsersIcon className="w-20 h-20 text-amber/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter leading-none mb-2">
                    {roomInfo?.name}
                  </h1>
                  <p className="text-sm text-text-muted">
                    {members.length} members • Created {new Date(roomInfo?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description Section */}
              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-amber uppercase tracking-widest">Description</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {roomInfo?.description || "No description provided."}
                  </p>
                </div>

                {/* Team Code Section */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Team Invite Code</span>
                    </div>
                    <button 
                      onClick={handleCopyCode}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        copied ? 'bg-success/20 text-success' : 'bg-amber/10 text-amber hover:bg-amber/20'
                      }`}
                    >
                      {copied ? <CheckIcon className="w-3 h-3" /> : "Copy"}
                      {copied ? "Copied" : "Copy Code"}
                    </button>
                  </div>
                  <div className="text-xl font-mono font-bold text-white tracking-widest bg-black/40 p-4 rounded-xl text-center border border-white/5">
                    {roomInfo?.invite_code}
                  </div>
                </div>

                {/* Member List Section */}
                <div className="space-y-4 pb-10">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-bold text-amber uppercase tracking-widest">
                      Members ({members.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {loading ? (
                      <div className="py-10 flex justify-center">
                        <div className="w-6 h-6 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
                      </div>
                    ) : (
                      members.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber/10 border border-amber/20 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-white">
                              {member.users?.avatar_url ? (
                                <img src={member.users.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                member.users?.display_name?.substring(0, 2).toUpperCase() || "CR"
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">
                                  {member.users?.display_name || "Unknown User"}
                                  {member.user_id === currentUserId && " (You)"}
                                </span>
                                {member.role === 'creator' && (
                                  <CrownIcon className="w-3 h-3 text-amber" />
                                )}
                                {member.role === 'admin' && (
                                  <ShieldCheckIcon className="w-3 h-3 text-success" />
                                )}
                              </div>
                              <span className="text-[10px] text-text-muted uppercase font-medium tracking-tight">
                                @{member.users?.username || "unknown"}
                              </span>
                            </div>
                          </div>

                          {isAdmin && member.user_id !== currentUserId && member.role !== 'creator' && (
                            <button 
                              onClick={() => handleRemoveMember(member.user_id)}
                              disabled={removingId === member.user_id}
                              className="p-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-all disabled:opacity-50"
                              title="Remove Member"
                            >
                              {removingId === member.user_id ? (
                                <div className="w-4 h-4 border-2 border-error/20 border-t-error rounded-full animate-spin" />
                              ) : (
                                <UserMinusIcon className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
