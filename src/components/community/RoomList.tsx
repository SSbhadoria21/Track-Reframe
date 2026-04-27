"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClapperboardIcon, LinkIcon, PlusIcon, SearchIcon, UserIcon } from "@/components/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinByCodeModal } from "./JoinByCodeModal";

interface Room {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  member_count: number;
  online_count: number;
  last_message_at: string;
  invite_code: string;
}

export function RoomList() {
  const params = useParams();
  const activeRoomId = params.id as string;
  
  const [tab, setTab] = useState<"my" | "discover">("my");
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [discoverRooms, setDiscoverRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [tab]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const endpoint = tab === "my" ? "/api/community/my-rooms" : "/api/community/discover";
      const res = await fetch(endpoint);
      const data = await res.json();
      if (tab === "my") setMyRooms(data.rooms || []);
      else setDiscoverRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = (tab === "my" ? myRooms : discoverRooms).filter(room => 
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-display text-lg font-bold text-white tracking-wide">Community</h2>
        <button 
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-full bg-amber text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-amber/20"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative group">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-amber transition-colors" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a room..." 
            className="w-full h-10 bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 text-sm text-white focus:outline-none focus:border-amber/50 focus:bg-black/60 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 gap-1 mb-2">
        <button 
          onClick={() => setTab("my")}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${tab === "my" ? "bg-white/10 text-white" : "text-text-muted hover:text-white"}`}
        >
          My Rooms
        </button>
        <button 
          onClick={() => setTab("discover")}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${tab === "discover" ? "bg-white/10 text-white" : "text-text-muted hover:text-white"}`}
        >
          Discover
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted italic">No rooms found.</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <Link 
              key={room.id}
              href={`/community/${room.id}`}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-[3px] relative group ${
                activeRoomId === room.id 
                  ? "bg-amber/5 border-amber" 
                  : "border-transparent hover:bg-white/[0.03]"
              }`}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-indigo/20 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                {room.cover_url ? (
                  <img src={room.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ClapperboardIcon className="w-5 h-5 text-indigo" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold text-sm truncate ${activeRoomId === room.id ? "text-white" : "text-text-secondary"}`}>
                    {room.name}
                  </span>
                  {room.online_count > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      {room.online_count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted truncate mt-0.5">
                  {room.description || "No description provided."}
                </p>
              </div>

              {/* Unread Indicator Mockup - Only show on client to avoid hydration mismatch */}
              {typeof window !== 'undefined' && Math.random() > 0.8 && activeRoomId !== room.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
              )}
            </Link>
          ))
        )}
      </div>

      {/* Bottom Button */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <button 
          onClick={() => setShowJoinByCode(true)}
          className="w-full h-11 bg-indigo/10 hover:bg-indigo/20 border border-indigo/20 rounded-xl text-xs font-bold uppercase tracking-widest text-indigo transition-all flex items-center justify-center gap-2"
        >
          <LinkIcon className="w-4 h-4" />
          Join by Code
        </button>

        <button 
          onClick={() => setShowCreate(true)}
          className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-text-primary transition-all flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4 text-amber" />
          Create Room
        </button>
      </div>

      <CreateRoomModal 
        isOpen={showCreate} 
        onClose={() => setShowCreate(false)} 
        onSuccess={() => {
          setShowCreate(false);
          fetchRooms();
        }}
      />

      <JoinByCodeModal 
        isOpen={showJoinByCode}
        onClose={() => setShowJoinByCode(false)}
      />
    </div>
  );
}
