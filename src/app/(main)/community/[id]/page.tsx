"use client";

import { useParams } from "next/navigation";
import { ChatArea } from "@/components/community/ChatArea";
import { CommunityRightPanel } from "@/components/community/CommunityRightPanel";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  return (
    <>
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatArea roomId={roomId} />
      </main>

      {/* Right Panel - Members & Watch Together */}
      <aside className="w-[220px] border-l border-white/5 bg-surface/30 hidden lg:flex flex-col shrink-0 overflow-hidden">
        <CommunityRightPanel roomId={roomId} />
      </aside>
    </>
  );
}
