import { type FastifyPluginAsync } from "fastify";
import { ChatRequestSchema } from "../schemas";
import { ConversationService } from "../services";
import { OllamaProvider } from "../providers";
import { GooglePlacesProvider } from "../providers";

const chat: FastifyPluginAsync = (fastify) => {
  const conversationService = new ConversationService(
    new OllamaProvider(),
    new GooglePlacesProvider()
  );

  fastify.post("/api/chat", async (request, reply) => {
    const { message, options } = ChatRequestSchema.parse(request.body);

    if (options.stream) {
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      try {
        const result = await conversationService.process(message);
        const payload = JSON.stringify({ success: true, data: result });
        reply.raw.write(`data: ${payload}\n\n`);
      } catch {
        const payload = JSON.stringify({
          success: false,
          message: "Internal server error",
        });
        reply.raw.write(`data: ${payload}\n\n`);
      }
      reply.raw.end();
      return reply.hijack();
    }

    const result = await conversationService.process(message);

    return {
      success: true,
      data: result,
    };
  });

  return Promise.resolve();
};

export default chat;
