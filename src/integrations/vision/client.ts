import { env } from "@/lib/env";
import { HttpVisionClient } from "@/integrations/vision/http-client";
import { MockVisionClient } from "@/integrations/vision/mock-client";
import type { VisionClient } from "@/integrations/vision/types";

let cachedClient: VisionClient | null = null;

export function getVisionClient(): VisionClient {
  if (cachedClient) return cachedClient;

  if (env.VISION_API_BASE_URL && env.VISION_API_TOKEN) {
    cachedClient = new HttpVisionClient(env.VISION_API_BASE_URL, { token: env.VISION_API_TOKEN });
  } else if (env.VISION_API_BASE_URL && env.VISION_API_USERNAME && env.VISION_API_PASSWORD) {
    cachedClient = new HttpVisionClient(env.VISION_API_BASE_URL, {
      username: env.VISION_API_USERNAME,
      password: env.VISION_API_PASSWORD,
    });
  } else {
    cachedClient = new MockVisionClient();
  }

  return cachedClient;
}
