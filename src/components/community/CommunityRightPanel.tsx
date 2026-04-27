"use client";

import { useState } from "react";
import { UsersIcon, FilmReelIcon } from "@/components/icons";
import { MemberList } from "./MemberList";
import { WatchTogether } from "./WatchTogether";

export function CommunityRightPanel({ roomId }: { roomId: string }) {
  const [tab, setTab] = useState<"members" | "watch">("members");

  return (
    <div className="flex flex-col h-full bg-surface/50">
      {/* Tabs */}
      <div className="flex p-2 gap-1 border-b border-white/5 shrink-0">
        <button 
          onClick={() => setTab("members")}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
            tab === "members" ? "bg-amber/10 text-amber border border-amber/20" : "text-text-muted hover:text-white"
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Members</span>
        </button>
        <button 
          onClick={() => setTab("watch")}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
            tab === "watch" ? "bg-indigo/10 text-indigo border border-indigo/20" : "text-text-muted hover:text-white"
          }`}
        >
          <FilmReelIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Watch</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "members" ? (
          <MemberList roomId={roomId} />
        ) : (
          <WatchTogether roomId={roomId} />
        )}
      </div>
    </div>
  );
}
