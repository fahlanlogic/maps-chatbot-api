export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  ollama: {
    host: process.env.OLLAMA_HOST || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
  },
} as const;

export type Config = typeof config;
