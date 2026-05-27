'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilmReelIcon } from '@/components/icons';
import { Calendar, Clock, ArrowRight, Trash2, Copy, FileText, Share2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function MyCallSheets() {
  const [callSheets, setCallSheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCallSheets();
  }, []);

  const fetchCallSheets = async () => {
    try {
      const res = await fetch('/api/call-sheets');
      if (!res.ok) throw new Error('Failed to load call sheets');
      const data = await res.json();
      setCallSheets(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load call sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this call sheet?')) return;
    
    try {
      const res = await fetch(`/api/call-sheets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCallSheets(prev => prev.filter(cs => cs.id !== id));
      toast.success('Call sheet deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete call sheet');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <FilmReelIcon className="w-8 h-8 text-amber animate-spin" />
          <p className="text-gray-400">Loading call sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FilmReelIcon className="w-8 h-8 text-amber" />
            My Call Sheets
          </h1>
          <p className="text-gray-400">Manage, export, and distribute your generated call sheets.</p>
        </div>
        <Link
          href="/studio/call-sheet"
          className="bg-amber hover:bg-amber/90 text-[#0A0A0F] font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,166,35,0.2)]"
        >
          <Plus className="w-5 h-5" />
          New Call Sheet
        </Link>
      </div>

      {callSheets.length === 0 ? (
        <div className="bg-[#111118] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Call Sheets Yet</h3>
          <p className="text-gray-400 mb-6">Create your first call sheet to organize your shoot day.</p>
          <Link
            href="/studio/call-sheet"
            className="bg-white/10 hover:bg-white/15 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Create Call Sheet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {callSheets.map((cs) => (
            <div key={cs.id} className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden hover:border-amber/30 transition-all group relative">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      cs.status === 'distributed' ? 'bg-green-500/20 text-green-400' :
                      cs.status === 'final' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {cs.status}
                    </span>
                    <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded font-mono">
                      v{cs.revision_number}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors" title="Duplicate (Coming Soon)">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-amber rounded hover:bg-white/10 transition-colors" title="Share (Coming Soon)">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cs.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded hover:bg-white/10 transition-colors" 
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 truncate">{cs.project_title}</h3>
                <p className="text-sm text-amber mb-4">Day {cs.shoot_day_number} of {cs.total_shoot_days}</p>
                
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(cs.shoot_date), 'EEEE, MMM do yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Call Time: {cs.general_call_time}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/5 p-3 bg-[#0A0A0F]">
                <Link
                  href={`/studio/call-sheet?id=${cs.id}`}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-amber transition-colors font-medium"
                >
                  Edit Call Sheet <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
