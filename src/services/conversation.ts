import type {
  Message,
  ChatResponse,
  LLMProvider,
  PlacesProvider,
  Place,
} from "../providers";

export class ConversationService {
  constructor(
    private readonly llm: LLMProvider,
    private readonly places: PlacesProvider
  ) {}

  async process(messages: Message[]): Promise<{
    message: { role: "assistant"; content: string };
    places?: Place[];
  }> {
    const response = await this.llm.chat(messages);

    if (response.type === "tool_call") {
      return this.handleToolCall(response, messages);
    }

    return {
      message: { role: "assistant", content: response.content },
    };
  }

  private async handleToolCall(
    response: ChatResponse,
    messages: Message[]
  ): Promise<{
    message: { role: "assistant"; content: string };
    places?: Place[];
  }> {
    if (!response.toolCall || response.toolCall.function !== "search_places") {
      throw new Error(`Unknown tool: ${response.toolCall?.function}`);
    }

    const raw = response.toolCall.arguments.query;
    const query = typeof raw === "string" ? raw : "";
    const places = await this.places.searchPlaces(query);

    if (places.length === 0) {
      return {
        message: {
          role: "assistant",
          content: `I couldn't find any places matching "${query}". Please try a different search.`,
        },
      };
    }

    const placesContext = places
      .map((p, i) => `${i + 1}. ${p.name} — ${p.address} (rating: ${p.rating})`)
      .join("\n");

    const summaryMessages: Message[] = [
      ...messages,
      {
        role: "assistant",
        content: response.content,
      },
      {
        role: "user",
        content: `Here are the places I found for "${query}":\n\n${placesContext}\n\nPlease provide a helpful summary and recommendation based on these real places. Format the response naturally as a chat assistant.`,
      },
    ];

    const summary = await this.llm.chat(summaryMessages);

    return {
      message: { role: "assistant", content: summary.content },
      places,
    };
  }
}
