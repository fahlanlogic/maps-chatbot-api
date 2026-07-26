import { config } from "../../config";
import type { Message, ChatResponse, LLMProvider } from "./llm-provider";

interface OllamaChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream: boolean;
  think?: boolean;
  options: {
    temperature: number;
    num_predict: number;
  };
  tools?: unknown[];
}

interface OllamaToolCall {
  function: { name: string; arguments: string };
}

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
}

export class OllamaProvider implements LLMProvider {
  private readonly host: string;
  private readonly model: string;

  constructor() {
    this.host = config.ollama.host;
    this.model = config.ollama.model;
  }

  async chat(messages: Message[]): Promise<ChatResponse> {
    const hasSystem = messages.some((m) => m.role === "system");
    const allMessages: { role: string; content: string }[] = [
      ...(hasSystem
        ? []
        : [
            {
              role: "system",
              content:
                "You are MapPilot, an AI assistant for finding places. Rules: - Answer directly. - Maximum 2 sentences. - Never explain your reasoning. - Never output thinking. - Never output <think> tags. - Never repeat yourself. - Never repeat the user's question. - If a tool is required, call it. - If no tool is required, answer immediately.",
            },
          ]),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const body: OllamaChatRequest = {
      model: this.model,
      messages: allMessages,
      stream: false,
      think: false,
      options: {
        temperature: 0.2,
        num_predict: 120,
      },
      tools: [
        {
          type: "function",
          function: {
            name: "search_places",
            description:
              "Search for places using Google Places API when the user asks about locations, restaurants, attractions, etc.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for places",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
    };

    const res = await fetch(`${this.host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const toolCalls = data.message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const tool = toolCalls[0];
      return {
        type: "tool_call",
        content: data.message.content || "",
        toolCall: {
          function: tool.function.name,
          arguments: JSON.parse(tool.function.arguments) as Record<
            string,
            unknown
          >,
        },
      };
    }

    return {
      type: "text",
      content: cleanResponse(data.message.content),
    };
  }
}

function cleanResponse(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
