import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { ChatContainer } from "@/components/chat/chat-container";
import type { ChatMessage } from "@/types";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ prompt?: string }>;
}

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps): Promise<React.JSX.Element> {
  const { conversationId } = await params;
  const { prompt } = await searchParams;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  const initialMessages: ChatMessage[] = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <>
      <Sidebar activeConversationId={conversationId} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatContainer
          conversationId={conversationId}
          initialMessages={initialMessages}
          initialPrompt={prompt}
        />
      </main>
    </>
  );
}
