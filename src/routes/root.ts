import { type FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = (fastify) => {
  fastify.get("/health", () => {
    return { status: "ok" };
  });

  fastify.get("/version", () => {
    return { name: "MapsChatbot AI Backend", version: "1.0.0" };
  });

  fastify.get("/", () => {
    return { service: "MapsChatbot AI Backend", version: "1.0.0" };
  });

  return Promise.resolve();
};

export default root;
