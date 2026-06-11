"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "lucide-react";

export function YoutubePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already subscribed
    const hasSubscribed = localStorage.getItem("track_reframe_yt_subscribed");
    
    // We want it to show when they login (or refresh) unless they subscribed.
    // If we only want to show it once per session if they dismiss it without subscribing,
    // we use sessionStorage for the dismissed state.
    const dismissedThisSession = sessionStorage.getItem("track_reframe_yt_dismissed");

    if (!hasSubscribed && !dismissedThisSession) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = () => {
    localStorage.setItem("track_reframe_yt_subscribed", "true");
    setIsVisible(false);
    window.open("https://www.youtube.com/@trackreframe", "_blank");
  };

  const handleDismiss = () => {
    sessionStorage.setItem("track_reframe_yt_dismissed", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="fixed bottom-6 left-6 z-50 w-[320px] bg-surface border border-border-default rounded-2xl shadow-2xl p-5"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary rounded-full transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col items-center text-center gap-3 pt-2">
            <div className="w-16 h-16 rounded-full bg-amber/20 flex items-center justify-center p-1">
              <img 
                src="https://yt3.googleusercontent.com/ytc/AIdro_k2Hn6VnU9mZ15t9wD7-7yP6oB8vG1u2fX0W=s176-c-k-c0x00ffffff-no-rj" 
                alt="Track Reframe" 
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icon.svg";
                }}
              />
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-text-primary">Track Reframe</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Join our YouTube community for filmmaking tutorials, gear reviews, and studio updates!
              </p>
            </div>
            
            <button 
              onClick={handleSubscribe}
              className="mt-2 w-full py-2.5 rounded-full bg-[#FF0000] text-white font-bold text-sm hover:bg-[#CC0000] transition-colors shadow-lg shadow-red-500/20"
            >
              Subscribe on YouTube
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
