const reasoningMarkers = [
  "Okay,",
  "The user",
  "I need to",
  "Let me",
  "My response",
  "Response:",
  "Analysis:",
] as const;

export function cleanResponse(content: string): string {
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  for (const marker of reasoningMarkers) {
    const index = cleaned.indexOf(marker);
    if (index > 0) {
      cleaned = cleaned.substring(0, index).trim();
    }
  }

  return cleaned;
}
