import fp from "fastify-plugin";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
});
