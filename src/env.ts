import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /*
   * Specify what prefix the client-side variables must have.
   * This is enforced both on type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",
  server: {
    PREFIX: z.preprocess((value) => value ?? "U#", z.string().min(1)),
    DATABASE_URL: z.string().url(),
  },
  client: {},
  runtimeEnv: process.env,
});
