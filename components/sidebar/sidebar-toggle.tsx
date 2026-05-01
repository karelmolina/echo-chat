"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  isOpen: boolean;
  setIsOpen: () => void;
}

export function SidebarToggle({ isOpen, setIsOpen }: SidebarToggleProps): React.JSX.Element {
  return (
    <div className="absolute -right-4 top-6 z-30 hidden lg:block">
      <button
        onClick={setIsOpen}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-md transition-transform duration-300 hover:bg-muted",
          isOpen ? "rotate-0" : "rotate-180"
        )}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
