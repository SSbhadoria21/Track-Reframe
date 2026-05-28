"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { ScreenplayExtension, ElementType } from '@/components/studio/collab-editor/ScreenplayExtension'
import { ArrowLeft, ChevronDown, Users, Share, Search, Settings, Download } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useMemo, use, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import './editor.css'

const colors = ['#F5A623', '#6C63FF', '#10B981', '#F43F5E', '#0EA5E9'];
const names = ['Quentin', 'Christopher', 'Greta', 'Martin', 'Steven', 'Sofia'];

export default function CollabEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    const doc = new Y.Doc()
    const prov = new WebrtcProvider(`track-reframe-collab-${resolvedParams.id}`, doc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    })

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let saveTimeout: NodeJS.Timeout;
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
          console.error("Auto-save failed", err)
        }
      }, 5000);
    }
    
    doc.on('update', handleUpdate)

    setYdoc(doc)
    setProvider(prov)

    return () => {
      clearTimeout(saveTimeout)
      doc.off('update', handleUpdate)
      prov.destroy()
      doc.destroy()
    }
  }, [resolvedParams.id])

  if (!provider || !ydoc) {
    return <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex items-center justify-center text-white font-mono text-sm">Loading Collaborative Workspace...</div>
  }

  return <CollabEditor provider={provider} ydoc={ydoc} />
}

function CollabEditor({ provider, ydoc }: { provider: WebrtcProvider, ydoc: Y.Doc }) {
  const [activeType, setActiveType] = useState<ElementType>('scene-heading');
  const [status, setStatus] = useState('connecting');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // Phase 4: Data States
  const [scenes, setScenes] = useState<{id: string, text: string, pos: number}[]>([]);
  const [characters, setCharacters] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [writingTime, setWritingTime] = useState(0);
  const [leftTab, setLeftTab] = useState<'navigator' | 'characters'>('navigator');
  
  const lastActiveTime = useRef<number>(Date.now());
  const editorRef = useRef<any>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
       if (Date.now() - lastActiveTime.current < 10000) {
         setWritingTime(prev => prev + 1);
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
    a.download = 'script.fountain';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    provider.on('synced', ({ synced }: { synced: boolean }) => {
      setStatus(synced ? 'connected (p2p)' : 'connecting...')
    })

    const userColor = colors[Math.floor(Math.random() * colors.length)];
    const userName = names[Math.floor(Math.random() * names.length)];
    
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
    })

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((state: any) => state.user).filter(Boolean);
      setActiveUsers(users);
    }
    
    provider.awareness.on('change', updateUsers);
    
    // Cleanup for awareness only (provider destruction is handled by parent)
    return () => {
      provider.awareness.off('change', updateUsers);
    }
  }, [provider])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, 
      }),
      ScreenplayExtension,
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
      
      // Phase 4: Extraction
      const newScenes: any[] = [];
      const charSet = new Set<string>();
      let words = 0;
      
      editor.state.doc.descendants((node, pos) => {
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
    },
    onSelectionUpdate: ({ editor }) => {
      const node = editor.state.selection.$from.node();
      if (node && node.attrs.screenplayType) {
        setActiveType(node.attrs.screenplayType);
      }
    }
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as ElementType;
    if (editor) {
      editor.commands.setScreenplayElement(type);
      editor.commands.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col text-white">
      <div className="h-12 bg-[#111118] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/studio/collab-editor/my-scripts" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="font-bold text-sm">Untitled Project</span>
            <span className="text-[10px] text-gray-400">Status: {status}</span>
          </div>
          <span className="ml-2 px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Feature Film</span>
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
          
          <button className="px-2 py-1 text-gray-400 hover:text-white font-serif font-bold">B</button>
          <button className="px-2 py-1 text-gray-400 hover:text-white font-serif italic">I</button>
          <button className="px-2 py-1 text-gray-400 hover:text-white font-serif underline">U</button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            {activeUsers.map((user, idx) => (
              <div 
                key={idx} 
                className="w-6 h-6 rounded-full border border-[#111118] flex items-center justify-center text-[10px] font-bold text-black" 
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors group relative">
            <Download className="w-3.5 h-3.5" /> Export
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A24] border border-white/10 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
               <div onClick={handleExportPDF} className="px-4 py-2 hover:bg-white/5 cursor-pointer text-left text-white">PDF (.pdf)</div>
               <div onClick={handleExportFountain} className="px-4 py-2 hover:bg-white/5 cursor-pointer text-left text-white">Fountain (.txt)</div>
            </div>
          </button>
          <button className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white font-bold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
            <Share className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 bg-[#111118] border-r border-white/5 flex flex-col shrink-0">
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

        <div className="flex-1 overflow-y-auto screenplay-editor-container bg-[#1A1A24]">
          <div className="screenplay-editor shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="w-64 bg-[#111118] border-l border-white/5 flex flex-col shrink-0">
          <div className="flex text-xs font-bold border-b border-white/5">
            <button className="flex-1 py-3 text-white border-b-2 border-[#6C63FF]">Stats</button>
            <button className="flex-1 py-3 text-gray-500 hover:text-white">Notes</button>
          </div>
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
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Scenes</div>
              <div className="text-lg font-bold font-mono text-white">{scenes.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Characters</div>
              <div className="text-lg font-bold font-mono text-white">{characters.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-8 bg-[#0A0A0F] border-t border-white/10 flex items-center justify-between px-4 text-[10px] text-gray-500 font-medium shrink-0">
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
          <span>● {activeUsers.length} writer{activeUsers.length !== 1 ? 's' : ''} online</span>
        </div>
      </div>
    </div>
  );
}
