"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function RecentListingsSidebar() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/crew/listings");
        if (res.ok) {
          const data = await res.json();
          // Filter only active and get the 3 most recent listings
          const activeListings = (data.listings || []).filter((l: any) => l.is_active);
          setListings(activeListings.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch recent listings:", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchTags = async () => {
      try {
        const res = await fetch("/api/search/tags");
        if (res.ok) {
          const data = await res.json();
          setTrendingTags(data.tags || []);
        }
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchListings();
    fetchTags();
  }, []);

  return (
    <div className="w-80 shrink-0 hidden lg:block sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto scrollbar-hide pb-10">
      <div className="bg-surface border border-border-default rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-default bg-black/5 dark:bg-black/20">
          <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
            <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Recent Job Listings
          </h2>
          <p className="text-xs text-text-muted mt-1">Opportunities to join the crew</p>
        </div>

        <div className="flex flex-col">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-2">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/5 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-text-muted">No recent listings found.</p>
            </div>
          ) : (
            listings.map((listing, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={listing.id}
                className="group border-b border-border-default last:border-0"
              >
                <Link href="/studio/find-crew" className="block p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <h3 className="font-bold text-sm text-text-primary group-hover:text-amber transition-colors line-clamp-1">
                    {listing.project_title}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
                    <span className="truncate max-w-[120px]">{listing.users?.display_name || 'Creator'}</span>
                    <span>•</span>
                    <span className="text-[10px] uppercase tracking-wider text-amber/80 font-bold">{listing.compensation_type}</span>
                    <span>•</span>
                    <span>{formatTime(listing.created_at)}</span>
                  </p>
                  
                  {listing.roles_needed && listing.roles_needed.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {listing.roles_needed.slice(0, 2).map((role: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 dark:bg-white/5 text-text-secondary border border-border-default">
                          {role}
                        </span>
                      ))}
                      {listing.roles_needed.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/5 dark:bg-white/5 text-text-muted">
                          +{listing.roles_needed.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))
          )}
        </div>
        
        <Link 
          href="/studio/find-crew" 
          className="p-3 text-center text-xs font-bold text-amber hover:bg-amber/10 transition-colors border-t border-border-default"
        >
          View All Opportunities
        </Link>
      </div>

      {/* Trending Topics Placeholder Container */}
      <div className="mt-6 bg-surface border border-border-default rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-default bg-black/5 dark:bg-black/20">
          <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending Tags
          </h2>
        </div>
        <div className="flex flex-col">
          {loadingTags ? (
            <div className="p-4 text-center text-xs text-text-muted">Loading tags...</div>
          ) : trendingTags.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted">No tags trending yet.</div>
          ) : (
            trendingTags.slice(0, 5).map((tag, i) => (
              <Link href={`/discover/tags?tag=${tag.tag.replace('#', '')}`} key={i} className="block p-4 border-b border-border-default last:border-0 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                <h3 className="font-bold text-sm text-text-primary group-hover:text-amber transition-colors">{tag.tag}</h3>
                <p className="text-xs text-text-muted mt-0.5">{tag.count} posts</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to format timestamps
function formatTime(dateStr: string | null): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
