import { Sidebar } from "@/components/sidebar";
import { ChatContainer } from "@/components/chat/chat-container";

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

  return (
    <>
      <Sidebar activeConversationId={conversationId} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatContainer conversationId={conversationId} initialPrompt={prompt} />
      </main>
    </>
  );
}
