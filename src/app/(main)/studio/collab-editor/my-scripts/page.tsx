"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createBrowserClient } from "@supabase/ssr";
import { Search, Plus, Filter, Clock, FileText, Users, MoreVertical, LayoutGrid, List as ListIcon, Folder, Trash2, Archive, Star, X, Loader2, Link2, Copy } from "lucide-react";

export default function MyScriptsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("All Scripts");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Feature Film");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const [modalTab, setModalTab] = useState<'create' | 'join'>('create');
  const [joinLink, setJoinLink] = useState('');

  const [scripts, setScripts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  
  const { data: session } = useSession();

  useEffect(() => {
    const fetchScripts = async () => {
      if (!session?.user?.email) return;

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      let uid = (session.user as any).id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uid || "");
      if (!isUuid) {
        const { data: userProfile } = await supabase.from("users").select("id").eq("email", session.user.email).maybeSingle();
        if (userProfile) {
          uid = userProfile.id;
        } else {
          return;
        }
      }
      
      setUserId(uid);

      // Fetch scripts owned by user
      const { data: ownedScripts, error: ownedErr } = await supabase.from('scripts').select('*').eq('user_id', uid).order('updated_at', { ascending: false });
      if (ownedErr) console.error("Error fetching owned scripts:", ownedErr);
      
      // Fetch collab records for these scripts to count collaborators
      const scriptIds = ownedScripts?.map(s => s.id) || [];

      // Fetch scripts user collaborates on (but doesn't own)
      const { data: collabRecords } = await supabase.from('script_collaborators').select('script_id').eq('user_id', uid);
      const collabScriptIds = collabRecords?.map(c => c.script_id) || [];
      
      const { data: collabScripts } = collabScriptIds.length > 0
        ? await supabase.from('scripts').select('*').in('id', collabScriptIds).neq('user_id', uid)
        : { data: [] };

      const allScriptIds = [...scriptIds, ...collabScriptIds];
      const { data: allCollabs } = allScriptIds.length > 0 
        ? await supabase.from('script_collaborators').select('script_id, user_id').in('script_id', allScriptIds)
        : { data: [] };

      // Map to attach collaborators to scripts
      const allMap = new Map();
      
      const processScript = (s: any) => {
        const collabs = allCollabs?.filter(c => c.script_id === s.id) || [];
        if (!collabs.find(c => c.user_id === s.user_id)) {
          collabs.unshift({ script_id: s.id, user_id: s.user_id });
        }
        allMap.set(s.id, { ...s, script_collaborators: collabs });
      };

      ownedScripts?.forEach(processScript);
      collabScripts?.forEach(processScript);
      
      const all = Array.from(allMap.values()).sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
      setScripts(all);
    };
    fetchScripts();
  }, []);

  const displayScripts = useMemo(() => {
    let result = scripts;
    if (activeTab === "My Scripts") {
      result = result.filter(s => s.user_id === userId && (!s.script_collaborators || s.script_collaborators.length <= 1));
    } else if (activeTab === "Shared with Me") {
      result = result.filter(s => s.user_id !== userId);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.title?.toLowerCase().includes(q));
    }

    if (filterType !== 'All') {
      result = result.filter(s => s.project_type === filterType);
    }

    return result;
  }, [scripts, activeTab, userId, searchQuery, filterType]);

  const handleDeleteScript = async (id: string) => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const script = scripts.find(s => s.id === id);
      if (!script) return;

      if (script.user_id === userId) {
        // Owner deleting the script
        const { error } = await supabase.from('scripts').delete().eq('id', id);
        if (error) throw error;
      } else {
        // Collaborator removing themselves
        const { error } = await supabase.from('script_collaborators').delete().eq('script_id', id).eq('user_id', userId);
        if (error) throw error;
      }
      
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error("Error deleting script:", err);
      alert("Failed to delete script: " + (err.message || "Unknown error"));
    }
  };

  const handleDuplicateScript = async (id: string) => {
    try {
      const scriptToDuplicate = scripts.find(s => s.id === id);
      if (!scriptToDuplicate) return;

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase.from('scripts').insert({
        title: `${scriptToDuplicate.title} (Copy)`,
        project_type: scriptToDuplicate.project_type,
        owner_id: userId,
        user_id: userId,
        page_count: scriptToDuplicate.page_count,
      }).select().single();
      
      if (error) throw error;
      
      if (data) {
        setScripts(prev => [data, ...prev]);
        alert("Script duplicated!");
      }
    } catch (err: any) {
      console.error("Error duplicating script:", err);
      alert("Failed to duplicate script: " + (err.message || "Unknown error"));
    }
  };

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

    if (!newTitle.trim() || !session?.user?.email) return;
    setIsCreating(true);
    setErrorMsg(null);
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      let uid = (session.user as any).id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uid || "");
      if (!isUuid) {
        const { data: userProfile } = await supabase.from("users").select("id").eq("email", session.user.email).maybeSingle();
        if (userProfile) {
          uid = userProfile.id;
        }
      }
      
      const { data, error } = await supabase.from('scripts').insert({
        title: newTitle,
        project_type: newType,
        owner_id: uid,
        user_id: uid, // Satisfy existing schema's not-null constraint
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
          <button suppressHydrationWarning onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-black font-bold py-2.5 rounded-lg hover:bg-[#F5A623]/90 transition-colors">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            
            <div className="relative flex items-center">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-[#111118] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-sm text-gray-400 hover:text-white focus:outline-none focus:border-[#F5A623] cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Feature Film">Feature Film</option>
                <option value="Short Film">Short Film</option>
                <option value="TV Pilot">TV Pilot</option>
                <option value="Commercial">Commercial</option>
              </select>
              <div className="absolute right-3 pointer-events-none border-l border-b border-gray-400 w-2 h-2 transform -rotate-45 -translate-y-1"></div>
            </div>
          </div>
        </div>

        {/* Script Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayScripts.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {displayScripts.map((script) => (
                <ScriptCard 
                  key={script.id}
                  id={script.id}
                  title={script.title || "Untitled Project"} 
                  type={(script.project_type || "Feature Film").toUpperCase()} 
                  pages={script.page_count || 0} 
                  time={`${Math.floor((script.writing_time_seconds || 0) / 3600)}h ${Math.floor(((script.writing_time_seconds || 0) % 3600) / 60)}m`} 
                  edited={script.updated_at ? new Date(script.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now"} 
                  onDelete={handleDeleteScript}
                  onDuplicate={handleDuplicateScript}
                  viewMode={viewMode}
                  collaborators={script.script_collaborators || []}
                />
              ))}
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

function ScriptCard({ title, type, pages, time, edited, id = "test-id", onDelete, onDuplicate, viewMode = 'grid', collaborators = [] }: { title: string, type: string, pages: number, time: string, edited: string, id?: string, onDelete?: (id: string) => void, onDuplicate?: (id: string) => void, viewMode?: 'grid' | 'list', collaborators?: any[] }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = () => {
    router.push(`/studio/collab-editor/${id}`);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/studio/collab-editor/${id}`;
    navigator.clipboard.writeText(link);
    alert("Share link copied to clipboard!");
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this script?")) {
      onDelete?.(id!);
    }
    setShowMenu(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(id!);
    setShowMenu(false);
  };

  if (viewMode === 'list') {
    return (
      <div onClick={handleCardClick} className="relative block group bg-[#111118] border border-white/5 rounded-xl p-4 hover:border-white/20 hover:border-[#6C63FF]/30 transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.5)] cursor-pointer flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
            <FileText className="w-6 h-6 text-gray-400 group-hover:text-[#F5A623] transition-colors" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-white text-base group-hover:text-[#F5A623] transition-colors truncate">{title}</h3>
              <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold tracking-wider text-gray-400 shrink-0">{type}</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {pages} Pages</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {time}</span>
              <span>•</span>
              <span>Edited {edited}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="flex -space-x-2">
            {collaborators.length > 0 ? collaborators.slice(0, 3).map((_, i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#111118] bg-gradient-to-tr ${['from-purple-500 to-indigo-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500'][i % 3]}`}></div>
            )) : (
              <div className="w-8 h-8 rounded-full border-2 border-[#111118] bg-gradient-to-tr from-purple-500 to-indigo-500"></div>
            )}
            {collaborators.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#111118] bg-[#2A2A35] flex items-center justify-center text-[10px] text-gray-400 font-bold">
                +{collaborators.length - 3}
              </div>
            )}
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${showMenu ? 'text-white bg-white/10' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-[#1A1A24] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden py-1">
                <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Share Link
                </button>
                <button onClick={handleDuplicate} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleCardClick} className="relative block group bg-[#111118] border border-white/5 rounded-xl p-5 hover:border-white/20 hover:border-[#6C63FF]/30 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer flex flex-col h-[200px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="inline-block px-2 py-1 rounded bg-white/5 text-[10px] font-bold tracking-wider text-gray-400 mb-2">{type}</span>
          <h3 className="font-bold text-white text-lg group-hover:text-[#F5A623] transition-colors line-clamp-1">{title}</h3>
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            className={`p-1 rounded hover:bg-white/10 transition-opacity shrink-0 ${showMenu ? 'opacity-100 text-white bg-white/10' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#1A1A24] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden py-1">
              <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Share Link
              </button>
              <button onClick={handleDuplicate} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <div className="h-px bg-white/10 my-1"></div>
              <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {pages} Pages</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {time}</span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex -space-x-2">
          {collaborators.length > 0 ? collaborators.slice(0, 3).map((_, i) => (
            <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#111118] bg-gradient-to-tr ${['from-purple-500 to-indigo-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500'][i % 3]}`}></div>
          )) : (
            <div className="w-7 h-7 rounded-full border-2 border-[#111118] bg-gradient-to-tr from-purple-500 to-indigo-500"></div>
          )}
          {collaborators.length > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-[#111118] bg-[#2A2A35] flex items-center justify-center text-[10px] text-gray-400 font-bold">
              +{collaborators.length - 3}
            </div>
          )}
        </div>
        <span className="text-[10px] text-gray-500 flex items-center gap-1">
          Edited {edited}
        </span>
      </div>
    </div>
  );
}
