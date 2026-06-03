"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { ScreenplayExtension, ElementType, PageBreak } from '@/components/studio/collab-editor/ScreenplayExtension'
import { ArrowLeft, ChevronDown, Users, Share, Search, Settings, Download, X, Copy, Mail, MessageSquare, CheckCircle2, Send, Save, FileText } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useMemo, use, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { getSession } from 'next-auth/react'
import TitlePage from '@/components/studio/collab-editor/TitlePage'
import './editor.css'

const colors = ['#F5A623', '#6C63FF', '#10B981', '#F43F5E', '#0EA5E9'];
const names = ['Quentin', 'Christopher', 'Greta', 'Martin', 'Steven', 'Sofia'];

// Global cache to prevent "A Yjs Doc connected to room already exists!" errors
// on React strict mode double-mounts or frequent navigations.
const yjsGlobalCache = new Map<string, { doc: Y.Doc, prov: WebrtcProvider }>();

export default function CollabEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;
    const roomName = `track-reframe-collab-${resolvedParams.id}`;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const initDoc = async () => {
      let doc: Y.Doc;
      let prov: WebrtcProvider;

      if (yjsGlobalCache.has(roomName)) {
        const cached = yjsGlobalCache.get(roomName)!;
        doc = cached.doc;
        prov = cached.prov;
        if (!prov) {
          // If prov is null, another useEffect is currently initializing it.
          // We can just return early, the other useEffect will set the state.
          return;
        }
      } else {
        doc = new Y.Doc();
        // Set cache immediately to block concurrent useEffects in Strict Mode
        yjsGlobalCache.set(roomName, { doc, prov: null as any });
        
        // 1. Fetch initial content from DB
        const { data } = await supabase.from('script_content').select('yjs_document').eq('script_id', resolvedParams.id).single();
        if (data && data.yjs_document) {
           try {
             let b64 = data.yjs_document;
             // Postgres bytea columns are returned as hex strings prefixed with \x
             if (typeof b64 === 'string' && b64.startsWith('\\x')) {
               b64 = Buffer.from(b64.slice(2), 'hex').toString('utf8');
             }
             const buf = Buffer.from(b64, 'base64');
             Y.applyUpdate(doc, new Uint8Array(buf));
           } catch (e) {
             console.warn("Failed to load initial Yjs doc from DB, starting fresh.", e);
           }
        }

        // 2. Setup WebRTC Provider
        prov = new WebrtcProvider(roomName, doc, {
          signaling: [
            'ws://localhost:4444',
            'wss://signaling.yjs.dev', 
            'wss://y-webrtc-signaling-eu.herokuapp.com',
            'wss://y-webrtc-signaling-us.herokuapp.com'
          ]
        });
        
        yjsGlobalCache.set(roomName, { doc, prov });
      }
      
      const handleUpdate = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            const stateVector = Y.encodeStateAsUpdate(doc);
            const base64 = Buffer.from(stateVector).toString('base64');
            
            await supabase.from('script_content').upsert({
              script_id: resolvedParams.id,
              yjs_document: base64,
              updated_at: new Date().toISOString()
            }, { onConflict: 'script_id' });
          } catch (err) {
            console.error("Auto-save content failed", err)
          }
        }, 1000); // reduced to 1000ms for saving every word almost instantly
      }
      
      doc.on('update', handleUpdate)

      setYdoc(doc)
      setProvider(prov)
    };

    initDoc();

    return () => {
      clearTimeout(saveTimeout)
      // We purposefully DO NOT destroy the doc and provider here
      // to keep them alive in the cache and prevent WebrtcProvider errors.
    }
  }, [resolvedParams.id])

  if (!provider || !ydoc) {
    return <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex items-center justify-center text-white font-mono text-sm">Loading Collaborative Workspace...</div>
  }

  return <CollabEditor provider={provider} ydoc={ydoc} scriptId={resolvedParams.id} />
}

function CollabEditor({ provider, ydoc, scriptId }: { provider: WebrtcProvider, ydoc: Y.Doc, scriptId: string }) {
  const [activeType, setActiveType] = useState<ElementType>('scene-heading');
  const [status, setStatus] = useState('connecting');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // Metadata States
  const [scriptTitle, setScriptTitle] = useState("Untitled Project");
  const [projectType, setProjectType] = useState("Feature Film");
  
  // Phase 4: Data States
  const [scenes, setScenes] = useState<{id: string, text: string, pos: number}[]>([]);
  const [characters, setCharacters] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [writingTime, setWritingTime] = useState(0);
  const [thinkingTime, setThinkingTime] = useState(0);
  const [leftTab, setLeftTab] = useState<'navigator' | 'characters'>('navigator');
  const [rightTab, setRightTab] = useState<'stats' | 'notes'>('stats');
  
  // Notes States
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Share Modal States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState<'link' | 'email' | 'dm'>('link');
  const [sharePermission, setSharePermission] = useState('view');
  const [shareEmail, setShareEmail] = useState('');
  const [shareSearch, setShareSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [shareStatusMsg, setShareStatusMsg] = useState('');
  
  // Autocomplete State
  const [autocomplete, setAutocomplete] = useState<{
    show: boolean;
    options: string[];
    selectedIndex: number;
    x: number;
    y: number;
    matchStart: number;
    matchEnd: number;
    type: 'scene' | 'time' | 'character';
  } | null>(null);

  const lastActiveTime = useRef<number>(Date.now());
  const editorRef = useRef<any>(null);
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      if (editorRef.current && ydoc) {
        // Save YJS Content
        const stateVector = Y.encodeStateAsUpdate(ydoc);
        const base64 = Buffer.from(stateVector).toString('base64');
        await supabase.from('script_content').upsert({
          script_id: scriptId,
          yjs_document: base64,
          updated_at: new Date().toISOString()
        }, { onConflict: 'script_id' });
        
        // Save Metadata
        await supabase.from('scripts').update({
          title: scriptTitle,
          word_count: wordCount,
          writing_time_seconds: writingTime,
          thinking_time_seconds: thinkingTime,
          page_count: Math.max(1, Math.ceil(wordCount / 180)),
          updated_at: new Date().toISOString()
        }).eq('id', scriptId);
      }
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setIsSaving(false), 2000);
  };

  const extractStats = (ed: any) => {
    if (!ed) return;
    const newScenes: any[] = [];
    const charSet = new Set<string>();
    let words = 0;
    
    ed.state.doc.descendants((node: any, pos: number) => {
      if (node.isTextblock) {
        const text = node.textContent;
        if (text) {
           const trimmed = text.trim();
           if (trimmed) words += trimmed.split(/\s+/).length;
        }
        
        if (node.attrs.screenplayType === 'scene-heading') {
           newScenes.push({ id: `scene-${pos}`, text, pos });
        } else if (node.attrs.screenplayType === 'character') {
           const name = text.trim().toUpperCase();
           const cleanName = name.replace(/\s*\(.*\)\s*$/, '').trim();
           if (cleanName) charSet.add(cleanName);
        }
      }
    });
    
    setScenes(newScenes);
    setCharacters(Array.from(charSet).sort());
    setWordCount(words);
  };

  // Fetch script metadata & notes on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      const { data, error } = await supabase.from('scripts').select('*').eq('id', scriptId).single();
      if (data) {
        setScriptTitle(data.title || "Untitled Project");
        setProjectType(data.project_type || "Feature Film");
        if (data.writing_time_seconds) setWritingTime(data.writing_time_seconds);
        if (data.thinking_time_seconds) setThinkingTime(data.thinking_time_seconds);
      }
      
      const { data: notesData } = await supabase.from('script_notes').select('*, users(username, avatar_url)').eq('script_id', scriptId).order('created_at', { ascending: false });
      if (notesData) setNotes(notesData);

      const session = await getSession();
      if (session?.user) {
        // Automatically add as collaborator if visited via link and authenticated
        await supabase.from('script_collaborators').upsert({
          script_id: scriptId,
          user_id: (session.user as any).id,
          permission: 'edit',
          last_seen_at: new Date().toISOString()
        }, { onConflict: 'script_id, user_id' });
      }
    };
    fetchMetadata();
  }, [scriptId, supabase]);

  // Periodic save for metadata (time, words)
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      await supabase.from('scripts').update({
        word_count: wordCount,
        writing_time_seconds: writingTime,
        thinking_time_seconds: thinkingTime,
        page_count: Math.max(1, Math.ceil(wordCount / 180)),
        updated_at: new Date().toISOString()
      }).eq('id', scriptId);
    }, 15000);
    return () => clearInterval(saveInterval);
  }, [wordCount, writingTime, thinkingTime, scriptId, supabase]);

  // Timer logic (3-second threshold)
  useEffect(() => {
    const interval = setInterval(() => {
       const idleTime = Date.now() - lastActiveTime.current;
       if (idleTime <= 3000) {
         setWritingTime(prev => prev + 1);
       } else {
         setThinkingTime(prev => prev + 1);
       }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const jumpToPos = (pos: number) => {
    if (editorRef.current) {
      editorRef.current.commands.setTextSelection(pos);
      editorRef.current.commands.focus();
      editorRef.current.view.dispatch(editorRef.current.state.tr.scrollIntoView());
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const session = await getSession();
    if (!session?.user) return;

    const { data, error } = await supabase.from('script_notes').insert({
      script_id: scriptId,
      user_id: (session.user as any).id,
      content: newNote.trim()
    }).select('*, users(username, avatar_url)').single();

    if (data) {
      setNotes(prev => [data, ...prev]);
      setNewNote('');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportFountain = () => {
    if (!editorRef.current) return;
    let text = '';
    editorRef.current.state.doc.descendants((node: any) => {
      if (node.isTextblock) {
        const content = node.textContent;
        const type = node.attrs.screenplayType;
        if (type === 'scene-heading') text += content.toUpperCase() + '\n\n';
        else if (type === 'character') text += '\n' + content.toUpperCase() + '\n';
        else if (type === 'dialogue') text += content + '\n\n';
        else if (type === 'parenthetical') text += '(' + content + ')\n';
        else if (type === 'transition') text += content.toUpperCase() + ':\n\n';
        else text += content + '\n\n'; 
      }
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptTitle}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // User search for DM sharing
  useEffect(() => {
    if (shareSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const cleanSearch = shareSearch.replace(/^@/, '');
      const { data } = await supabase.from('users')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${cleanSearch}%,display_name.ilike.%${cleanSearch}%`)
        .limit(5);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [shareSearch, supabase]);

  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail) return;
    setShareStatusMsg("Sending invite to email...");
    
    try {
      const session = await getSession();
      if (!session?.user) throw new Error("Not logged in");

      // Generate a unique token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase.from('script_invitations').insert({
        script_id: scriptId,
        invited_email: shareEmail,
        invited_by: (session.user as any).id,
        permission: sharePermission,
        token: token,
        status: 'pending'
      });

      if (error) {
        if (error.code === '23505') throw new Error("This email is already invited.");
        throw error;
      }

      setShareStatusMsg("Invite sent successfully!");
      setShareEmail("");
      setTimeout(() => setShareStatusMsg(""), 3000);
    } catch (err: any) {
      setShareStatusMsg(err.message || "Failed to send invite");
      setTimeout(() => setShareStatusMsg(""), 3000);
    }
  };

  const handleShareDM = async (targetUserId: string) => {
    setShareStatusMsg("Sending DM...");
    try {
      const session = await getSession();
      if (!session?.user) throw new Error("You must be logged in to send a DM.");

      const link = `${window.location.origin}/studio/collab-editor/${scriptId}`;
      const msg = `Hey! I'm inviting you to collaborate on my script "${scriptTitle}". Join here: ${link}`;
      
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          content: msg
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send DM");
      }

      setShareStatusMsg("Script shared via DM!");
      setShareSearch("");
      setSearchResults([]);
      setTimeout(() => setShareStatusMsg(""), 3000);
    } catch (err: any) {
      setShareStatusMsg(err.message || "Failed to send DM");
      setTimeout(() => setShareStatusMsg(""), 3000);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/studio/collab-editor/${scriptId}?perm=${sharePermission}`;
    navigator.clipboard.writeText(link);
    setShareStatusMsg("Link copied to clipboard!");
    setTimeout(() => setShareStatusMsg(""), 3000);
  };

  useEffect(() => {
    provider.on('synced', ({ synced }: { synced: boolean }) => {
      setStatus(synced ? 'connected (p2p)' : 'connecting...')
      if (synced && editorRef.current) {
        setTimeout(() => extractStats(editorRef.current), 100);
      }
    })

    const userColor = colors[Math.floor(Math.random() * colors.length)];
    const userName = names[Math.floor(Math.random() * names.length)];
    
    // In a real app, use the authenticated user's details
    getSession().then((session) => {
       const name = session?.user?.name || session?.user?.email || userName;
       provider.awareness.setLocalStateField('user', { name, color: userColor })
    });

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((state: any) => state.user).filter(Boolean);
      setActiveUsers(users);
    }
    
    provider.awareness.on('change', updateUsers);
    
    return () => {
      provider.awareness.off('change', updateUsers);
    }
  }, [provider, supabase])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, 
      }),
      Underline,
      ScreenplayExtension,
      PageBreak,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: provider.awareness.getLocalState()?.user || { name: 'Anonymous', color: '#f5a623' },
      }),
    ],
    onUpdate: ({ editor }) => {
      lastActiveTime.current = Date.now();
      
      const node = editor.state.selection.$from.node();
      if (node && node.attrs.screenplayType) {
        setActiveType(node.attrs.screenplayType);
      }
      
      extractStats(editor);
      checkAutocomplete(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      const node = editor.state.selection.$from.node();
      if (node && node.attrs.screenplayType) {
        setActiveType(node.attrs.screenplayType);
      }
      checkAutocomplete(editor);
    }
  });

  const checkAutocomplete = (editor: any) => {
    const { $from } = editor.state.selection;
    const node = $from.node();
    const type = node.attrs.screenplayType;
    const text = node.textContent;
    const pos = $from.pos;
    const textUntilCursor = text.substring(0, pos - $from.start());
    
    try {
      const coords = editor.view.coordsAtPos(pos);
      
      if (type === 'scene-heading') {
        const t = textUntilCursor.toUpperCase();
        
        if (t.length > 0 && t.length <= 4 && !t.includes(' ') && !t.includes('-')) {
          const prefixes = ['INT. ', 'EXT. ', 'INT./EXT. ', 'I/E. '];
          const matches = prefixes.filter(p => p.startsWith(t) && p !== t);
          if (matches.length > 0) {
            setAutocomplete({ show: true, options: matches, selectedIndex: 0, x: coords.left, y: coords.top + 25, matchStart: $from.start(), matchEnd: pos, type: 'scene' });
            return;
          }
        }
        
        const timeMatch = textUntilCursor.match(/( - | – )([A-Za-z]*)$/i);
        if (timeMatch) {
          const query = timeMatch[2].toUpperCase();
          const times = ['DAY', 'NIGHT', 'EVENING', 'MORNING', 'CONTINUOUS', 'LATER', 'SAME'];
          const matches = times.filter(time => time.startsWith(query) && time !== query);
          if (matches.length > 0) {
            setAutocomplete({ show: true, options: matches, selectedIndex: 0, x: coords.left, y: coords.top + 25, matchStart: pos - query.length, matchEnd: pos, type: 'time' });
            return;
          }
        }
      } else if (type === 'character') {
        const query = textUntilCursor.toUpperCase();
        if (query.length > 0) {
          const allChars = new Set<string>();
          editor.state.doc.descendants((n: any) => {
             if (n.type.name === 'paragraph' && n.attrs.screenplayType === 'character') {
                const c = n.textContent.trim().toUpperCase();
                if (c && !c.includes('(')) allChars.add(c);
             }
          });
          const matches = Array.from(allChars).filter(c => c.startsWith(query) && c !== query);
          if (matches.length > 0) {
            setAutocomplete({ show: true, options: matches, selectedIndex: 0, x: coords.left, y: coords.top + 25, matchStart: $from.start(), matchEnd: pos, type: 'character' });
            return;
          }
        }
      }
    } catch(e) {}
    
    setAutocomplete(null);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (!autocomplete?.show) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setAutocomplete(prev => prev ? { ...prev, selectedIndex: (prev.selectedIndex + 1) % prev.options.length } : null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setAutocomplete(prev => prev ? { ...prev, selectedIndex: (prev.selectedIndex - 1 + prev.options.length) % prev.options.length } : null);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      applySuggestion(autocomplete.options[autocomplete.selectedIndex]);
    } else if (e.key === 'Escape') {
      setAutocomplete(null);
    }
  };

  const applySuggestion = (option: string) => {
    if (!autocomplete || !editorRef.current) return;
    editorRef.current.chain().focus()
      .deleteRange({ from: autocomplete.matchStart, to: autocomplete.matchEnd })
      .insertContent(option)
      .run();
    setAutocomplete(null);
  };

  useEffect(() => {
    editorRef.current = editor;
    if (editor && (provider as any)?.synced) {
      extractStats(editor);
    }
  }, [editor, provider]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as ElementType;
    if (editor) {
      editor.commands.setScreenplayElement(type);
      editor.commands.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col text-white print:static print:h-auto print:bg-white print:text-black print:block">
      <div className="h-12 bg-[#111118] border-b border-white/10 flex items-center justify-between px-4 shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/studio/collab-editor/my-scripts" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{scriptTitle}</span>
            <span className="text-[10px] text-gray-400">Status: {status}</span>
          </div>
          <span className="ml-2 px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{projectType}</span>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={activeType} 
            onChange={handleTypeChange}
            className="bg-[#1A1A24] border border-white/10 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:border-[#F5A623]"
          >
            <option value="scene-heading">Scene Heading (Ctrl+1)</option>
            <option value="action">Action (Ctrl+2)</option>
            <option value="character">Character (Ctrl+3)</option>
            <option value="dialogue">Dialogue (Ctrl+4)</option>
            <option value="parenthetical">Parenthetical (Ctrl+5)</option>
            <option value="transition">Transition (Ctrl+6)</option>
            <option value="shot">Shot (Ctrl+7)</option>
            <option value="general">General (Ctrl+8)</option>
          </select>
          
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          
          <button 
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-2 py-1 font-serif font-bold transition-colors ${editor?.isActive('bold') ? 'text-[#F5A623] bg-white/10 rounded' : 'text-gray-400 hover:text-white'}`}
          >B</button>
          <button 
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 font-serif italic transition-colors ${editor?.isActive('italic') ? 'text-[#F5A623] bg-white/10 rounded' : 'text-gray-400 hover:text-white'}`}
          >I</button>
          <button 
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 font-serif underline transition-colors ${editor?.isActive('underline') ? 'text-[#F5A623] bg-white/10 rounded' : 'text-gray-400 hover:text-white'}`}
          >U</button>

          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <button onClick={() => editor?.commands.setPageBreak()} title="Insert Page Break (Ctrl+Enter)" className="px-2 py-1 text-gray-400 hover:text-white flex items-center gap-1 transition-colors group">
             <FileText className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold group-hover:text-white">PAGE BREAK</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            {activeUsers.map((user, idx) => (
              <div 
                key={idx} 
                className="w-6 h-6 rounded-full border border-[#111118] flex items-center justify-center text-[10px] font-bold text-black group relative cursor-pointer" 
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
                <div className="absolute top-full mt-2 bg-white text-black text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 before:content-[''] before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2 before:border-[3px] before:border-transparent before:border-b-white">
                  {user.name}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleManualSave} disabled={isSaving} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saved!' : 'Save'}
          </button>
          <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors group relative">
            <Download className="w-3.5 h-3.5" /> Export
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A24] border border-white/10 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
               <div onClick={handleExportPDF} className="px-4 py-2 hover:bg-white/5 cursor-pointer text-left text-white">PDF (.pdf)</div>
               <div onClick={handleExportFountain} className="px-4 py-2 hover:bg-white/5 cursor-pointer text-left text-white">Fountain (.txt)</div>
            </div>
          </button>
          <button onClick={() => setIsShareOpen(true)} className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
            <Share className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden print:block print:overflow-visible print:h-auto">
        <div className="w-56 bg-[#111118] border-r border-white/5 flex flex-col shrink-0 print:hidden">
          <div className="flex text-xs font-bold border-b border-white/5">
            <button onClick={() => setLeftTab('navigator')} className={`flex-1 py-3 ${leftTab === 'navigator' ? 'text-white border-b-2 border-[#F5A623]' : 'text-gray-500 hover:text-white'}`}>Navigator</button>
            <button onClick={() => setLeftTab('characters')} className={`flex-1 py-3 ${leftTab === 'characters' ? 'text-white border-b-2 border-[#F5A623]' : 'text-gray-500 hover:text-white'}`}>Characters</button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {leftTab === 'navigator' && (
              <div className="space-y-1">
                {scenes.length === 0 && <div className="text-xs text-gray-500 text-center mt-4">No scenes yet.</div>}
                {scenes.map((scene, i) => (
                   <div key={scene.id} onClick={() => jumpToPos(scene.pos)} className="text-xs text-gray-300 hover:text-white mb-1 font-medium hover:bg-white/5 px-2 py-1.5 rounded cursor-pointer transition-colors truncate">
                     <span className="opacity-50 mr-2">{i+1}</span>{scene.text || 'UNTITLED SCENE'}
                   </div>
                ))}
              </div>
            )}
            {leftTab === 'characters' && (
              <div className="space-y-1">
                {characters.length === 0 && <div className="text-xs text-gray-500 text-center mt-4">No characters yet.</div>}
                {characters.map((char, i) => (
                   <div key={i} className="text-xs text-gray-300 font-medium px-2 py-1.5 border-b border-white/5">
                     {char}
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto screenplay-editor-container bg-[#1A1A24] print:block print:overflow-visible print:bg-white print:p-0 relative scrollbar-hide"
          id="editor-scroll-container"
          onKeyDownCapture={handleEditorKeyDown}
        >
          <TitlePage ydoc={ydoc} />
          
          <div className="screenplay-editor shadow-[0_0_50px_rgba(0,0,0,0.5)] print:shadow-none print:bg-white flex justify-center py-12">
            <EditorContent editor={editor} />
          </div>
          
          {/* Autocomplete Popup */}
          {autocomplete?.show && (
             <div 
               className="fixed z-50 bg-[#1A1A25] border border-white/10 rounded-lg shadow-2xl py-1 px-1 flex flex-col w-48"
               style={{ top: autocomplete.y, left: autocomplete.x }}
             >
                {autocomplete.options.map((opt, i) => (
                   <div 
                      key={opt}
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent losing focus
                        applySuggestion(opt);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold font-mono cursor-pointer rounded ${i === autocomplete.selectedIndex ? 'bg-amber text-black' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
                   >
                      {opt}
                   </div>
                ))}
             </div>
          )}
        </div>

        <div className="w-64 bg-[#111118] border-l border-white/5 flex flex-col shrink-0 print:hidden">
          <div className="flex text-xs font-bold border-b border-white/5">
            <button onClick={() => setRightTab('stats')} className={`flex-1 py-3 ${rightTab === 'stats' ? 'text-white border-b-2 border-[#6C63FF]' : 'text-gray-500 hover:text-white'}`}>Stats</button>
            <button onClick={() => setRightTab('notes')} className={`flex-1 py-3 ${rightTab === 'notes' ? 'text-white border-b-2 border-[#6C63FF]' : 'text-gray-500 hover:text-white'}`}>Notes</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'stats' ? (
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Page Count</div>
                  <div className="text-2xl font-bold font-mono">{Math.max(1, Math.ceil(wordCount / 180))} <span className="text-xs text-gray-500 font-sans">/ 120 approx</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Writing Time</div>
                  <div className="text-lg font-bold font-mono text-[#F5A623]">{formatTime(writingTime)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Thinking Time</div>
                  <div className="text-lg font-bold font-mono text-[#6C63FF]">{formatTime(thinkingTime)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Scenes</div>
                  <div className="text-lg font-bold font-mono text-white">{scenes.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Characters</div>
                  <div className="text-lg font-bold font-mono text-white">{characters.length}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {notes.length === 0 && <div className="text-xs text-gray-500 text-center mt-4">No notes yet. Add one below!</div>}
                  {notes.map(note => (
                    <div key={note.id} className="bg-white/5 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10">
                           {note.users?.avatar_url ? <img src={note.users.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{note.users?.username?.charAt(0).toUpperCase()}</div>}
                        </div>
                        <span className="text-xs font-bold text-gray-300">@{note.users?.username}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed text-xs">{note.content}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-white/5 bg-[#0A0A0F]/50">
                  <form onSubmit={handleCreateNote} className="relative">
                    <input 
                      type="text" 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..." 
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-[#6C63FF] transition-colors"
                    />
                    <button type="submit" disabled={!newNote.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6C63FF] hover:text-white disabled:opacity-50 disabled:hover:text-[#6C63FF] transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-8 bg-[#0A0A0F] border-t border-white/10 flex items-center justify-between px-4 text-[10px] text-gray-500 font-medium shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <span>Page {Math.max(1, Math.ceil(wordCount / 180))}</span>
          <span>{wordCount} Words</span>
          <span>{scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-white/10 text-white uppercase tracking-wider">{activeType.replace('-', ' ')}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#F5A623]">Writing: {formatTime(writingTime)}</span>
          <span className="text-[#6C63FF]">Thinking: {formatTime(thinkingTime)}</span>
          <span>● {activeUsers.length} writer{activeUsers.length !== 1 ? 's' : ''} online</span>
        </div>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A0F]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Share className="w-5 h-5 text-[#6C63FF]" /> Share Script</h2>
              <button onClick={() => setIsShareOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex border-b border-white/5 px-6 pt-2 gap-6 bg-[#0A0A0F]/30 text-sm font-medium">
              <button onClick={() => setShareTab('link')} className={`pb-3 border-b-2 ${shareTab === 'link' ? 'border-[#6C63FF] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Share Link</button>
              <button onClick={() => setShareTab('email')} className={`pb-3 border-b-2 ${shareTab === 'email' ? 'border-[#6C63FF] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Send Email</button>
              <button onClick={() => setShareTab('dm')} className={`pb-3 border-b-2 ${shareTab === 'dm' ? 'border-[#6C63FF] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Direct Message</button>
            </div>

            <div className="p-6">
              {shareStatusMsg && (
                <div className="mb-4 p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-sm flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {shareStatusMsg}
                </div>
              )}
              
              {shareTab === 'link' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Generate a shareable link. Anyone with this link can access the script.</p>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Permission</label>
                    <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6C63FF] transition-colors appearance-none">
                      <option value="view">Can View</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <button onClick={copyShareLink} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <Copy className="w-4 h-4" /> Copy Link
                    </button>
                  </div>
                </div>
              )}

              {shareTab === 'email' && (
                <form onSubmit={handleShareEmail} className="space-y-4">
                  <p className="text-sm text-gray-400">Send an email invitation. They will be prompted to log in to Track Reframe.</p>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={shareEmail} 
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="colleague@example.com" 
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6C63FF] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Permission</label>
                    <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6C63FF] transition-colors appearance-none">
                      <option value="view">Can View</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <Mail className="w-4 h-4" /> Send Invite
                    </button>
                  </div>
                </form>
              )}

              {shareTab === 'dm' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Search for a Track Reframe user and send them an invite via Direct Message.</p>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      value={shareSearch}
                      onChange={(e) => setShareSearch(e.target.value)}
                      placeholder="Search username..." 
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-[#6C63FF] transition-colors"
                    />
                  </div>
                  
                  {searchResults.length > 0 ? (
                    <div className="mt-4 border border-white/10 rounded-lg bg-[#1A1A24] overflow-hidden">
                      {searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                              {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.username.charAt(0).toUpperCase()}</div>}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{user.display_name || user.username}</div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                          <button onClick={() => handleShareDM(user.id)} className="bg-white/10 hover:bg-[#6C63FF] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Send DM
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (shareSearch.length > 1 && (
                    <div className="mt-4 text-center text-sm text-gray-500 py-4">No users found.</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
