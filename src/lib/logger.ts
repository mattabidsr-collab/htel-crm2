import pino from "pino";

import { env } from "@/lib/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: {
    paths: ["password", "passwordHash", "*.password", "*.passwordHash", "authorization"],
    censor: "[redacted]",
  },
});
