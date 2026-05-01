"use client";

import { useState } from "react";
import { Menu, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";
import { NewConversationButton } from "@/components/sidebar/new-conversation-button";
import { ConversationList } from "@/components/sidebar/conversation-list";

interface SidebarProps {
  activeConversationId?: string;
}

export function Sidebar({ activeConversationId }: SidebarProps): React.JSX.Element {
  const sidebar = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isOpen, toggleOpen, getOpenState, setIsHover } = sidebar;
  const isExpanded = getOpenState();

  return (
    <>
      {/* Mobile header */}
      <div className="fixed left-0 top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="size-4 text-primary-foreground" />
          </div>
          <span className="font-headline text-base font-semibold">Echo Chat</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile: fixed overlay, desktop: flex item with width transition */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:transition-[width] lg:duration-300",
          // Mobile states
          mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
          // Desktop states
          isExpanded ? "lg:w-72" : "lg:w-[90px]"
        )}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header / Brand */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <MessageSquare className="size-4 text-primary-foreground" />
          </div>
          <span
            className={cn(
              "font-headline text-lg font-semibold whitespace-nowrap transition-[opacity,transform,width] ease-in-out duration-300 overflow-hidden",
              isExpanded
                ? "opacity-100 translate-x-0 w-auto"
                : "opacity-0 -translate-x-4 w-0 lg:w-0"
            )}
          >
            Echo Chat
          </span>
        </div>

        {/* New Conversation Button */}
        <div className="p-3">
          <NewConversationButton isCollapsed={!isExpanded} />
        </div>

        {/* Conversation List */}
        <ConversationList
          activeConversationId={activeConversationId}
          isCollapsed={!isExpanded}
        />
      </aside>
    </>
  );
}
