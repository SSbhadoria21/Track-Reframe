"use client";

import { createContext, useContext } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a fallback instead of throwing to prevent complete app crashes during hydration
    return {
        theme: 'dark' as Theme,
        toggleTheme: () => {}
    };
  }
  return context;
}
