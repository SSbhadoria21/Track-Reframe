"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Search, Plus, Filter, Clock, FileText, Users, MoreVertical, LayoutGrid, List as ListIcon, Folder, Trash2, Archive, Star, X, Loader2 } from "lucide-react";

export default function MyScriptsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("All Scripts");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Feature Film");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const [modalTab, setModalTab] = useState<'create' | 'join'>('create');
  const [joinLink, setJoinLink] = useState('');

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalTab === 'join') {
      if (!joinLink.trim()) return;
      try {
        const url = new URL(joinLink);
        // Assuming the link format is /studio/collab-editor/[id]
        router.push(url.pathname + url.search);
      } catch (err) {
        setErrorMsg("Invalid URL. Please paste a valid Track Reframe share link.");
      }
      return;
    }

    if (!newTitle.trim()) return;
    setIsCreating(true);
    setErrorMsg(null);
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.from('scripts').insert({
        title: newTitle,
        project_type: newType,
        owner_id: userData.user?.id || null,
        user_id: userData.user?.id || null, // Satisfy existing schema's not-null constraint
      }).select('id').single();
      
      if (error) throw error;
      if (data) {
        router.push(`/studio/collab-editor/${data.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || JSON.stringify(err) || "Unknown error occurred.");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0A0A0F]">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#111118] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-black font-bold py-2.5 rounded-lg hover:bg-[#F5A623]/90 transition-colors">
            <Plus className="w-5 h-5" /> New Script
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Library</h3>
            <nav className="space-y-1">
              <NavItem icon={FileText} label="All Scripts" active={activeTab === "All Scripts"} onClick={() => setActiveTab("All Scripts")} />
              <NavItem icon={Star} label="My Scripts" active={activeTab === "My Scripts"} onClick={() => setActiveTab("My Scripts")} />
              <NavItem icon={Users} label="Shared with Me" active={activeTab === "Shared with Me"} onClick={() => setActiveTab("Shared with Me")} />
            </nav>
          </div>
          
          <div className="px-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3 flex justify-between items-center">
              Folders
              <button className="hover:text-white"><Plus className="w-3 h-3" /></button>
            </h3>
            <nav className="space-y-1">
              <NavItem icon={Folder} label="Feature Films" />
              <NavItem icon={Folder} label="Shorts" />
              <NavItem icon={Folder} label="Commercials" />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 space-y-1">
          <NavItem icon={Archive} label="Archived" active={activeTab === "Archived"} onClick={() => setActiveTab("Archived")} />
          <NavItem icon={Trash2} label="Trash" active={activeTab === "Trash"} onClick={() => setActiveTab("Trash")} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0F]/80 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-white">{activeTab}</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search scripts..." 
                className="bg-[#111118] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-[#F5A623] w-64"
              />
            </div>
            
            <div className="flex items-center bg-[#111118] rounded-lg border border-white/10 p-0.5">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            
            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-[#111118]">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Script Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "All Scripts" ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              <ScriptCard title="The Last Sunset" type="FEATURE FILM" pages={120} time="45h 12m" edited="2h ago" />
              <ScriptCard title="Neon Dreams" type="SHORT FILM" pages={15} time="6h 30m" edited="1d ago" />
              <ScriptCard title="Quantum Drift" type="TV PILOT" pages={60} time="22h 15m" edited="3d ago" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
               <FileText className="w-16 h-16 mb-4 text-gray-500" />
               <h3 className="text-lg font-bold text-white mb-2">No Scripts Found</h3>
               <p className="text-sm text-gray-400">There are no scripts in this category.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0F]/50">
              <h2 className="text-lg font-bold text-white">New Script</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex border-b border-white/5 px-6 pt-2 gap-6 bg-[#0A0A0F]/30 text-sm font-medium">
              <button onClick={() => setModalTab('create')} className={`pb-3 border-b-2 ${modalTab === 'create' ? 'border-[#F5A623] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Create New</button>
              <button onClick={() => setModalTab('join')} className={`pb-3 border-b-2 ${modalTab === 'join' ? 'border-[#F5A623] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Join via Link</button>
            </div>
            <form onSubmit={handleCreateScript} className="p-6">
              {errorMsg && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-4">
                {modalTab === 'create' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Script Title</label>
                      <input required autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} type="text" placeholder="e.g., The Last Sunset" className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Type</label>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] transition-colors appearance-none">
                        <option value="Feature Film">Feature Film</option>
                        <option value="Short Film">Short Film</option>
                        <option value="TV Pilot">TV Pilot</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Share Link</label>
                    <input required autoFocus value={joinLink} onChange={(e) => setJoinLink(e.target.value)} type="text" placeholder="Paste link here..." className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#F5A623] transition-colors" />
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating && modalTab === 'create'} className="bg-[#F5A623] text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#F5A623]/90 transition-colors flex items-center gap-2">
                  {(isCreating && modalTab === 'create') ? <><Loader2 className="w-4 h-4 animate-spin" /> {modalTab === 'create' ? 'Creating...' : 'Joining...'}</> : (modalTab === 'create' ? 'Create Script' : 'Join Script')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ScriptCard({ title, type, pages, time, edited, id = "test-id" }: { title: string, type: string, pages: number, time: string, edited: string, id?: string }) {
  return (
    <Link href={`/studio/collab-editor/${id}`} className="block group bg-[#111118] border border-white/5 rounded-xl p-5 hover:border-white/20 hover:border-[#6C63FF]/30 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer flex flex-col h-[200px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2 py-1 rounded bg-white/5 text-[10px] font-bold tracking-wider text-gray-400 mb-2">{type}</span>
          <h3 className="font-bold text-white text-lg group-hover:text-[#F5A623] transition-colors line-clamp-1">{title}</h3>
        </div>
        <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.preventDefault()}>
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {pages} Pages</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {time}</span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border-2 border-[#111118]"></div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border-2 border-[#111118]"></div>
        </div>
        <span className="text-[10px] text-gray-500 flex items-center gap-1">
          Edited {edited}
        </span>
      </div>
    </Link>
  );
}
