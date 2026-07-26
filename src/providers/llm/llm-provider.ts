export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolCall {
  function: string;
  arguments: Record<string, unknown>;
}

export interface ChatResponse {
  type: "text" | "tool_call";
  content: string;
  toolCall?: ToolCall;
}

export interface LLMProvider {
  chat(messages: Message[]): Promise<ChatResponse>;
}
