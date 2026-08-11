import { env } from "@/lib/env";
import { HttpSkySwitchClient } from "@/integrations/skyswitch/http-client";
import { MockSkySwitchClient } from "@/integrations/skyswitch/mock-client";
import type { SkySwitchClient } from "@/integrations/skyswitch/types";

let cachedClient: SkySwitchClient | null = null;

export function getSkySwitchClient(): SkySwitchClient {
  if (cachedClient) return cachedClient;

  if (env.SKYSWITCH_CLIENT_ID && env.SKYSWITCH_CLIENT_SECRET && env.SKYSWITCH_API_BASE_URL) {
    cachedClient = new HttpSkySwitchClient(
      env.SKYSWITCH_API_BASE_URL,
      env.SKYSWITCH_CLIENT_ID,
      env.SKYSWITCH_CLIENT_SECRET,
      env.SKYSWITCH_TOKEN_URL,
    );
  } else {
    cachedClient = new MockSkySwitchClient();
  }

  return cachedClient;
}
