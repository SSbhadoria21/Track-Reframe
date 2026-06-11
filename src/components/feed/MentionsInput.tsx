"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Tag {
  tag: string;
  count: number;
}

interface MentionsInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  minRows?: number;
  className?: string;
}

export function MentionsInput({ value, onChange, placeholder, onFocus, minRows = 1, className = "" }: MentionsInputProps) {
  const [dropdownType, setDropdownType] = useState<"users" | "tags" | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [caretCoords, setCaretCoords] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse text to find mentions and tags for highlighting
  const renderHighlights = (text: string) => {
    // Regex for @mentions and #hashtags
    const parts = text.split(/(@[\w_]+|#[\w\u0590-\u05ff]+)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-indigo bg-indigo/10 rounded">{part}</span>;
      } else if (part.startsWith("#")) {
        return <span key={i} className="text-amber bg-amber/10 rounded">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Fetch options based on type and query
  useEffect(() => {
    if (!dropdownType) return;
    
    const fetchOptions = async () => {
      try {
        if (dropdownType === "users") {
          const res = await fetch(`/api/search/users?q=${searchQuery}`);
          const data = await res.json();
          setDropdownOptions(data.users || []);
        } else if (dropdownType === "tags") {
          // Send without # for api
          const q = searchQuery.replace("#", "");
          const res = await fetch(`/api/search/tags?q=${q}`);
          const data = await res.json();
          setDropdownOptions(data.tags || []);
        }
        setActiveIndex(0);
      } catch (e) {
        console.error(e);
      }
    };
    
    // Debounce slightly
    const timer = setTimeout(fetchOptions, 150);
    return () => clearTimeout(timer);
  }, [dropdownType, searchQuery]);

  // Handle caret position tracking for dropdown placement
  const updateDropdown = () => {
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const textBefore = value.substring(0, cursor);
    
    // Match the last word before cursor if it starts with @ or #
    const match = textBefore.match(/(@|#)([\w_]*)$/);
    
    if (match) {
      const type = match[1] === "@" ? "users" : "tags";
      setDropdownType(type);
      setSearchQuery(match[2]);
      
      // Simple caret coords heuristic based on scroll and text (exact CSS cloning is complex, this is a fast approximation)
      // We will place dropdown below textarea statically for simplicity and robust UI.
    } else {
      setDropdownType(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Use timeout to let cursor update
    setTimeout(updateDropdown, 0);
  };

  const insertMention = (replacement: string) => {
    const el = textareaRef.current;
    if (!el) return;
    
    const cursor = el.selectionStart;
    const textBefore = value.substring(0, cursor);
    const textAfter = value.substring(cursor);
    
    const match = textBefore.match(/(@|#)([\w_]*)$/);
    if (match) {
      const beforeMatch = textBefore.substring(0, match.index);
      const newText = beforeMatch + replacement + " " + textAfter;
      onChange(newText);
      
      // Restore focus and cursor position after React re-renders
      setTimeout(() => {
        el.focus();
        const newCursorPos = beforeMatch.length + replacement.length + 1;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    setDropdownType(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (dropdownType && dropdownOptions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % dropdownOptions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + dropdownOptions.length) % dropdownOptions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = dropdownOptions[activeIndex];
        if (dropdownType === "users") {
          insertMention(`@${selected.username}`);
        } else {
          insertMention(selected.tag);
        }
      } else if (e.key === "Escape") {
        setDropdownType(null);
      }
    }
  };

  // Auto-resize
  const rows = Math.max(minRows, value.split("\n").length);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Highlights Overlay */}
      <div 
        className="absolute inset-0 p-3 pointer-events-none whitespace-pre-wrap break-words text-sm font-sans leading-relaxed text-text-primary m-0 border border-transparent box-border"
        aria-hidden="true"
      >
        {renderHighlights(value)}
        {/* Trailing space fix for trailing newlines */}
        {value.endsWith("\n") ? <br /> : null}
      </div>

      {/* Actual Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onClick={updateDropdown}
        onKeyUp={updateDropdown}
        placeholder={placeholder}
        rows={rows}
        className="relative w-full font-sans overflow-hidden bg-transparent p-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none leading-relaxed caret-text-primary z-10 m-0 border border-transparent box-border"
        style={{
          // Hide text but keep cursor visible using standard color transparent logic
          color: "inherit",
          // The background of the textarea must be transparent so overlay shows through if we used custom colors, 
          // but we actually want the text to be visible so we just layer the highlights BEHIND the text.
          // Wait, if highlights are behind, they must be semi-transparent backgrounds only, or we use `color: transparent` and let highlights provide the color.
          // Let's use color: transparent for the text, and let the overlay render the actual text.
        }}
      />
      {/* Wait, the inline style above overrides the class. I will update it. */}
      
      <style jsx>{`
        textarea {
          color: transparent !important;
          caret-color: #fff; /* fallback */
          caret-color: var(--color-text-primary);
        }
      `}</style>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownType && dropdownOptions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-50 w-full max-w-xs mt-1 bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
            style={{ top: "100%", left: 0 }}
          >
            {dropdownType === "users" && dropdownOptions.map((user, i) => (
              <div 
                key={user.id}
                onClick={() => insertMention(`@${user.username}`)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${i === activeIndex ? "bg-white/10 dark:bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-indigo">
                      {user.display_name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary">{user.display_name}</div>
                  <div className="text-xs text-text-muted">@{user.username}</div>
                </div>
              </div>
            ))}

            {dropdownType === "tags" && dropdownOptions.map((tag, i) => (
              <div 
                key={tag.tag}
                onClick={() => insertMention(tag.tag)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${i === activeIndex ? "bg-white/10 dark:bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="text-sm font-bold text-amber">{tag.tag}</div>
                <div className="text-xs text-text-muted">{tag.count} posts</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
