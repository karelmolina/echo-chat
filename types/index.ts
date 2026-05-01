export interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
}

export interface ConversationsResponse {
  conversations: ConversationListItem[];
}
