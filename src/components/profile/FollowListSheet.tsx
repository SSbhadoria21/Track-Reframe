"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface FollowListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  userId?: string;
}

export function FollowListSheet({ isOpen, onClose, type, userId }: FollowListSheetProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetch(`/api/user/follow/list?userId=${userId}&type=${type}`)
        .then(res => res.json())
        .then(data => {
          if (data.users) setUsers(data.users);
        })
        .finally(() => setLoading(false));
    } else {
      setUsers([]);
    }
  }, [isOpen, userId, type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[70vh] bg-surface border-t border-white/10 rounded-t-3xl z-[201] flex flex-col shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] md:max-w-[500px] md:mx-auto"
          >
            <div className="flex justify-center p-3">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            
            <div className="px-6 pb-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="font-display font-bold text-xl text-white capitalize">{type}</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-text-muted hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-white/5" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-white/5 rounded mb-2" />
                        <div className="h-3 w-48 bg-white/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <span className="text-4xl mb-3">👻</span>
                  <p className="text-text-muted">No {type} found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map(user => (
                    <Link 
                      href={`/creator/${user.username}`} 
                      key={user.id}
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo/50 to-indigo-hover flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user.display_name || user.username || "U").substring(0,2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white truncate group-hover:text-amber transition-colors">
                            {user.display_name}
                          </h4>
                          {user.roles && user.roles.length > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/5 text-text-muted">
                              {user.roles[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate mt-0.5">@{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
