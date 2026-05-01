"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NewConversationButtonProps {
  isCollapsed?: boolean;
}

export function NewConversationButton({
  isCollapsed = false,
}: NewConversationButtonProps): React.JSX.Element {
  const router = useRouter();

  const handleClick = (): void => {
    const id = crypto.randomUUID();
    router.push(`/${id}`);
  };

  return (
    <Button
      variant="default"
      className={cn(
        "w-full justify-center gap-2 transition-all duration-300",
        !isCollapsed && "lg:justify-start"
      )}
      onClick={handleClick}
      title="New Conversation"
    >
      <Plus className="size-4 shrink-0" />
      <span
        className={cn(
          "whitespace-nowrap transition-[opacity,transform] ease-in-out duration-300",
          isCollapsed
            ? "opacity-0 -translate-x-2 hidden lg:hidden"
            : "opacity-100 translate-x-0"
        )}
      >
        New Conversation
      </span>
    </Button>
  );
}
