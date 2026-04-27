import { FilmReelIcon } from "@/components/icons";

export default function CommunityPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0A0A0F]">
      <div className="w-24 h-24 rounded-[32px] bg-amber/5 flex items-center justify-center mb-8 border border-amber/10 shadow-2xl shadow-amber/5">
        <FilmReelIcon className="w-12 h-12 text-amber animate-pulse" />
      </div>
      <h2 className="text-3xl font-display font-black text-white mb-3 uppercase tracking-tighter">The Production Office</h2>
      <p className="text-text-muted max-w-sm text-sm leading-relaxed">
        Select a crew room from the sidebar to start collaborating, or discover public communities to expand your network.
      </p>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-left group hover:bg-white/[0.04] transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center mb-4 text-amber font-bold">
            01
          </div>
          <h3 className="font-bold text-white text-sm mb-1">Assemble Your Crew</h3>
          <p className="text-[11px] text-text-muted leading-relaxed">Create a private room for your production and invite your team via a unique code.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-left group hover:bg-white/[0.04] transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center mb-4 text-indigo font-bold">
            02
          </div>
          <h3 className="font-bold text-white text-sm mb-1">Sync & Screen</h3>
          <p className="text-[11px] text-text-muted leading-relaxed">Use Watch Together to review dailies or find inspiration with live synchronized playback.</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 w-full max-w-xl flex justify-between items-center px-4">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Rooms</span>
          <span className="text-lg font-display font-bold text-white">4,281</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Creators Online</span>
          <span className="text-lg font-display font-bold text-success">12.5k</span>
        </div>
      </div>
    </div>
  );
}
