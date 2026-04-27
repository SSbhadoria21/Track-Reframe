import { RoomList } from "@/components/community/RoomList";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Left Panel - Room List */}
      <aside className="w-[280px] border-r border-white/5 bg-surface/30 flex flex-col shrink-0">
        <RoomList />
      </aside>

      {/* Main & Right Panels are handled in the specific room pages */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
