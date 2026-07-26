import fp from "fastify-plugin";
import { ZodError } from "zod";
import { type FastifyError } from "fastify";

export default fp(function (fastify) {
  fastify.setErrorHandler(
    (error: FastifyError | ZodError | Error, request, reply) => {
      if (error instanceof ZodError) {
        reply.status(422).send({
          success: false,
          message: "Validation error",
          errors: error.issues,
        });
        return;
      }

      const fastifyError = error as FastifyError;

      if (fastifyError.statusCode === 429) {
        reply.status(429).send({
          success: false,
          message: "Too many requests. Please try again later.",
        });
        return;
      }

      request.log.error(error);

      const statusCode = fastifyError.statusCode || 500;

      reply.status(statusCode).send({
        success: false,
        message: statusCode === 500 ? "Internal server error" : error.message,
      });
    }
  );
});
