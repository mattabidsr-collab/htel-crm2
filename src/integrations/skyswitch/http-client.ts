import { logger } from "@/lib/logger";
import type { NormalizedCdr, SkySwitchClient } from "@/integrations/skyswitch/types";

/**
 * HTTP adapter for SkySwitch's Call Detail Records API.
 *
 * IMPORTANT — unverified assumptions: this session has no SkySwitch API
 * credentials and cannot reach developers.skyswitch.com (blocked by this
 * sandbox's network egress policy), so the exact endpoint schema is
 * unconfirmed — the build spec itself lists "what data may be pulled from
 * NetSapiens/SkySwitch APIs" as an open decision (section 17, item 6).
 * What IS confirmed (via search, not the docs themselves): the SkySwitch
 * API is a REST/JSON API secured by OAuth2 client-credentials, not a
 * static API key. This client implements that token exchange and assumes
 * a CDR path like `/domains/{domain}/cdrs2` (SkySwitch runs on the
 * NetSapiens platform, whose REST API commonly exposes CDRs there) via a
 * configurable path template. Confirm both the token endpoint and the CDR
 * endpoint/field names against Heritage's actual developer portal access
 * before enabling this in production.
 */
export class HttpSkySwitchClient implements SkySwitchClient {
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly tokenUrl = "https://webapi.skyswitch.com/oauth2/token",
    private readonly cdrPathTemplate = "/domains/{domain}/cdrs2",
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`SkySwitch OAuth2 token exchange failed with status ${response.status}`);
    }

    const body = (await response.json()) as { access_token: string; expires_in?: number };
    this.cachedToken = {
      value: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 - 30_000,
    };
    return body.access_token;
  }

  async fetchRecentCalls(domain: string, since: Date): Promise<NormalizedCdr[]> {
    const token = await this.getAccessToken();
    const path = this.cdrPathTemplate.replace("{domain}", encodeURIComponent(domain));
    const url = new URL(path, this.baseUrl);
    url.searchParams.set("since", since.toISOString());

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!response.ok) {
      logger.error({ status: response.status, domain }, "SkySwitch CDR fetch failed");
      throw new Error(`SkySwitch CDR fetch failed with status ${response.status}`);
    }

    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) return [];

    return body
      .map((row) => normalize(row as Record<string, unknown>, domain))
      .filter((r): r is NormalizedCdr => r !== null);
  }
}

function normalize(row: Record<string, unknown>, domain: string): NormalizedCdr | null {
  const callId = row.call_id ?? row.id;
  const from = row.orig_from_num ?? row.from_number;
  const to = row.orig_to_num ?? row.to_number;
  const start = row.time_start ?? row.start_time;
  if (!callId || !from || !to || !start) return null;

  return {
    externalCallId: String(callId),
    domain,
    direction: row.direction === "inbound" ? "INBOUND" : "OUTBOUND",
    fromNumber: String(from),
    toNumber: String(to),
    startedAt: new Date(String(start)),
    durationSeconds: Number(row.duration ?? row.time_talking ?? 0),
  };
}
