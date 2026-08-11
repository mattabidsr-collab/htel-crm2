import { env } from "@/lib/env";
import { MicrosoftGraphEmailProvider } from "@/integrations/email/microsoft-graph-client";
import { MockEmailProvider } from "@/integrations/email/mock-client";
import type { EmailProvider } from "@/integrations/email/types";

let cachedProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_ID) {
    cachedProvider = new MicrosoftGraphEmailProvider(
      env.MICROSOFT_TENANT_ID,
      env.MICROSOFT_CLIENT_ID,
      env.MICROSOFT_CLIENT_SECRET,
    );
  } else {
    cachedProvider = new MockEmailProvider();
  }

  return cachedProvider;
}
