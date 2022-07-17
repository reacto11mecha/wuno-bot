import { config } from "dotenv";
config();

/**
 * Bot setting for the valid prefix
 */
export const PREFIX = process.env.PREFIX || "U#";
