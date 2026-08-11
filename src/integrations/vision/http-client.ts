import { createHash } from "node:crypto";

import { logger } from "@/lib/logger";
import type { NormalizedVisionTicket, VisionClient } from "@/integrations/vision/types";

export interface VisionAuth {
  token?: string;
  username?: string;
  password?: string; // hashed with md5() before sending, per the confirmed API example
}

/**
 * HTTP adapter for Vision Helpdesk's ticket API.
 *
 * CONFIRMED (from Vision Helpdesk's own doc excerpts pasted during this
 * build, including a real "get_tickets" example against
 * visiononlinedemo.com): requests are GET with query-string parameters
 * against `{baseUrl}/api/index.php`, using `vis_module`/`vis_operation`
 * naming, `vis_encode=json` for JSON responses, and auth via either
 * `vis_txtusername` + `vis_txtuserpass` (MD5 hash of the password) or a
 * single `vis_txttoken` passed as-is (no hashing) in the query string.
 * Bulk listing is `vis_operation=get_tickets`, filterable via
 * `vis_filter=<field>=<value>` (confirmed example: `status_id=1`). The
 * single-ticket lookup operation is `ticket_details` with a numeric
 * `vis_ticket_id`.
 *
 * STILL UNCONFIRMED: Vision's numeric `status_id` scheme (which IDs mean
 * open vs. closed) and whether `get_tickets` supports any date-range or
 * "updated since" filter — the only confirmed `vis_filter` field is
 * `status_id`. Because of that, this client does not send a date filter;
 * it fetches the full ticket list each sync and relies on the idempotent
 * upsert in `syncVisionTickets()` to make repeated syncs cheap and safe.
 * The `since` parameter is accepted for interface parity with the mock
 * client but currently unused by the real HTTP path — wire it to
 * `vis_filter` once Heritage confirms the status_id scheme or a real
 * date-filter field with Vision support.
 */
export class HttpVisionClient implements VisionClient {
  constructor(
    private readonly baseUrl: string,
    private readonly auth: VisionAuth,
    private readonly endpointPath = "/api/index.php",
    private readonly ticketUrlTemplate = "{baseUrl}/manage/#/ticket/ticket_details/{maskId}/{numericId}",
  ) {}

  private authParams(): Record<string, string> {
    if (this.auth.token) return { vis_txttoken: this.auth.token };
    if (this.auth.username && this.auth.password) {
      return {
        vis_txtusername: this.auth.username,
        vis_txtuserpass: createHash("md5").update(this.auth.password).digest("hex"),
      };
    }
    throw new Error("Vision Helpdesk auth requires either a token or a username+password");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for VisionClient interface parity; see class doc
  async fetchRecentTickets(since: Date): Promise<NormalizedVisionTicket[]> {
    const url = new URL(this.endpointPath, this.baseUrl);
    const params = {
      ...this.authParams(),
      vis_module: "ticket",
      vis_operation: "get_tickets", // confirmed
      vis_encode: "json",
      // No confirmed date-range filter exists yet — see class doc.
      // The idempotent upsert downstream makes a full re-fetch safe.
    };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      logger.error({ status: response.status }, "Vision Helpdesk ticket fetch failed");
      throw new Error(`Vision Helpdesk ticket fetch failed with status ${response.status}`);
    }

    const responseBody = (await response.json()) as unknown;
    const rows = Array.isArray(responseBody)
      ? responseBody
      : ((responseBody as { tickets?: unknown[] }).tickets ?? []);
    if (!Array.isArray(rows)) return [];

    return rows
      .map((row) => this.normalize(row as Record<string, unknown>))
      .filter((t): t is NormalizedVisionTicket => t !== null);
  }

  private normalize(row: Record<string, unknown>): NormalizedVisionTicket | null {
    const maskId = row.mask_id ?? row.ticket_mask_id ?? row.id;
    const numericId = row.ticket_id ?? row.id;
    const subject = row.subject ?? row.title;
    if (!maskId || !subject) return null;

    const status = String(row.status ?? "open").toLowerCase();
    const externalUrl = this.ticketUrlTemplate
      .replace("{baseUrl}", this.baseUrl)
      .replace("{maskId}", String(maskId))
      .replace("{numericId}", String(numericId ?? maskId));

    return {
      externalTicketId: String(maskId),
      externalNumericId: numericId ? String(numericId) : undefined,
      externalUrl,
      subject: String(subject),
      status,
      isOpen: !["closed", "resolved"].includes(status),
      priority: row.priority ? String(row.priority) : undefined,
      category: row.category ? String(row.category) : undefined,
      requesterEmail: row.requester_email ? String(row.requester_email) : undefined,
      requesterName: row.requester_name ? String(row.requester_name) : undefined,
      technician: row.assigned_to ? String(row.assigned_to) : undefined,
      externalCustomerId: String(row.customer_id ?? row.client_id ?? ""),
      externalCustomerName: row.customer_name ? String(row.customer_name) : undefined,
      visionCreatedAt: new Date(String(row.created_at ?? Date.now())),
      visionUpdatedAt: new Date(String(row.updated_at ?? Date.now())),
      visionResolvedAt: row.resolved_at ? new Date(String(row.resolved_at)) : undefined,
    };
  }
}
