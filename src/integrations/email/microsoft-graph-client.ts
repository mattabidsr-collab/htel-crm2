import { logger } from "@/lib/logger";
import type { EmailProvider, NormalizedEmailMessage } from "@/integrations/email/types";

interface GraphMessage {
  id: string;
  conversationId: string;
  subject: string | null;
  from: { emailAddress: { address: string } } | null;
  toRecipients: { emailAddress: { address: string } }[];
  ccRecipients: { emailAddress: { address: string } }[];
  receivedDateTime: string;
  sentDateTime: string;
  body: { contentType: "text" | "html"; content: string };
  hasAttachments: boolean;
  attachments?: { name: string; contentType: string; size: number }[];
}

const MESSAGE_FIELDS =
  "id,conversationId,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,body,hasAttachments";

/**
 * Microsoft Graph adapter for Outlook/Exchange mailboxes, using app-only
 * (client-credentials) auth against an Entra ID app registration with the
 * Mail.Read application permission and admin consent granted — this reads
 * any mailbox in the tenant by address without a per-mailbox OAuth
 * consent flow, unlike Gmail's per-user delegated model.
 *
 * The Graph API surface here (endpoints, field names, OAuth token flow)
 * is Microsoft's stable, documented v1.0 API and is implemented directly
 * against that spec — this is not a guess. What's still unverified in
 * this sandbox is Heritage's actual Entra ID app registration (client
 * ID/secret, tenant, and that Mail.Read has been granted admin consent)
 * — nothing here can be run without it.
 */
export class MicrosoftGraphEmailProvider implements EmailProvider {
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly tenantId: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const response = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: "https://graph.microsoft.com/.default",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph token exchange failed with status ${response.status}`);
    }

    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      value: body.access_token,
      expiresAt: Date.now() + body.expires_in * 1000 - 30_000,
    };
    return body.access_token;
  }

  async listMessagesSince(mailboxAddress: string, since: Date): Promise<NormalizedEmailMessage[]> {
    const token = await this.getAccessToken();
    const filter = `receivedDateTime ge ${since.toISOString()}`;
    const url = new URL(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxAddress)}/messages`,
    );
    url.searchParams.set("$filter", filter);
    url.searchParams.set("$select", MESSAGE_FIELDS);
    url.searchParams.set("$orderby", "receivedDateTime desc");
    url.searchParams.set("$top", "50");

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!response.ok) {
      logger.error({ status: response.status, mailboxAddress }, "Graph message list failed");
      throw new Error(`Microsoft Graph message list failed with status ${response.status}`);
    }

    const body = (await response.json()) as { value: GraphMessage[] };

    return Promise.all(
      body.value.map((message) => this.normalize(message, mailboxAddress, token)),
    );
  }

  private async normalize(
    message: GraphMessage,
    mailboxAddress: string,
    token: string,
  ): Promise<NormalizedEmailMessage> {
    const fromAddress = message.from?.emailAddress.address.toLowerCase() ?? "";
    const direction = fromAddress === mailboxAddress.toLowerCase() ? "OUTBOUND" : "INBOUND";

    let attachments: NormalizedEmailMessage["attachments"] = [];
    if (message.hasAttachments) {
      attachments = await this.fetchAttachmentMetadata(mailboxAddress, message.id, token);
    }

    return {
      providerMessageId: message.id,
      providerThreadId: message.conversationId,
      direction,
      fromAddress,
      toAddresses: message.toRecipients.map((r) => r.emailAddress.address.toLowerCase()),
      ccAddresses: message.ccRecipients.map((r) => r.emailAddress.address.toLowerCase()),
      subject: message.subject,
      bodyText: message.body.contentType === "text" ? message.body.content : null,
      bodyHtml: message.body.contentType === "html" ? message.body.content : null,
      sentAt: new Date(message.sentDateTime ?? message.receivedDateTime),
      attachments,
    };
  }

  private async fetchAttachmentMetadata(
    mailboxAddress: string,
    messageId: string,
    token: string,
  ): Promise<NormalizedEmailMessage["attachments"]> {
    // ACT-15: metadata only — attachment bytes are never fetched or stored.
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxAddress)}/messages/${messageId}/attachments?$select=name,contentType,size`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return [];

    const body = (await response.json()) as {
      value: { name: string; contentType: string; size: number }[];
    };
    return body.value.map((a) => ({
      filename: a.name,
      contentType: a.contentType,
      sizeBytes: a.size,
    }));
  }
}
