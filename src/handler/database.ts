import mongoose from "mongoose";
import type { Logger } from "pino";

/**
 * Function that handle database connectivity
 * @param mongoUri Valid MongoDB URI
 * @param logger Pino logger instance
 * @returns void
 */
export const connectDatabase = (mongoUri: string, logger: Logger) =>
  mongoose
    .connect(mongoUri)
    .then(() => logger.info("[DB] Connected"))
    .catch((error) => {
      logger.error({ error });
      process.exit();
    });
