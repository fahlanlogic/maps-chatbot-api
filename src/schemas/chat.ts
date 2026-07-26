import { z } from "zod";

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

export const ChatOptionsSchema = z.object({
  stream: z.boolean().optional().default(false),
});

export const ChatRequestSchema = z.object({
  message: z.array(MessageSchema).min(1),
  options: ChatOptionsSchema.optional().default({ stream: false }),
});

export const ChatResponseDataSchema = z.object({
  message: z.object({
    role: z.literal("assistant"),
    content: z.string(),
  }),
  places: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
        rating: z.number(),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        mapsUrl: z.string(),
      })
    )
    .optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponseData = z.infer<typeof ChatResponseDataSchema>;
