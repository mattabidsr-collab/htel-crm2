import { Queue, type ConnectionOptions } from "bullmq";

import { env } from "@/lib/env";

const connection: ConnectionOptions = { url: env.REDIS_URL };

const queues = new Map<string, Queue>();

/**
 * Lazily creates (and memoizes) a BullMQ queue by name.
 * Background jobs must be retryable and idempotent (nonfunctional requirements, reliability).
 */
export function getQueue(name: string): Queue {
  const existing = queues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 60 * 60 * 24 * 7 },
      removeOnFail: false,
    },
  });
  queues.set(name, queue);
  return queue;
}

// Known queues. Workers are added as each integration/stage is built
// (billing import, Vision sync, email sync, GoHighLevel sync, renewal alerts).
export const QUEUE_NAMES = {
  billingImport: "billing-import",
  visionSync: "vision-sync",
  emailSync: "email-sync",
  renewalAlerts: "renewal-alerts",
} as const;
