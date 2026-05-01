"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggleOpen: () => void;
  getOpenState: () => boolean;
  setIsHover: (value: boolean) => void;
  isHover: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STATE_KEY = "sidebar:state";

function getInitialOpenState(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
  return stored !== null ? stored === "true" : true;
}

export function SidebarProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(getInitialOpenState);
  const [isHover, setIsHover] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      return next;
    });
  }, []);

  const getOpenState = useCallback(() => (isHover ? true : isOpen), [isHover, isOpen]);
  const handleSetIsHover = useCallback((value: boolean) => setIsHover(value), []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggleOpen, getOpenState, setIsHover: handleSetIsHover, isHover }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
