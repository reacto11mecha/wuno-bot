import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

config();

export const env = createEnv({
  /*
   * Specify what prefix the client-side variables must have.
   * This is enforced both on type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",
  server: {
    PREFIX: z.preprocess((value) => value ?? "U#", z.string().min(1)),
    DATABASE_URL: z.string().url(),
    CHROME_PATH: z.string().min(1),
  },
  client: {},
  runtimeEnv: process.env,
});
