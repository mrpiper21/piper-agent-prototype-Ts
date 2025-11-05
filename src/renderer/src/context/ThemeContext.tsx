import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || 'light';
    
    // Apply theme immediately to prevent flash
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    
    return initialTheme;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Apply theme synchronously to DOM to ensure all components update together
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    // Use flushSync to ensure all React updates happen synchronously
    // This forces layout, sidebar, and pages to update at the same time
    flushSync(() => {
      setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        // Apply immediately to DOM for instant visual feedback
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
        return newTheme;
      });
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

