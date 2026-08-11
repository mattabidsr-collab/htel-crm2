import { db } from "@/lib/db";
import type { EmailProvider, NormalizedEmailMessage } from "@/integrations/email/types";

// Generates realistic-looking messages against real contacts already in
// the database — including one from an unmatched external address and
// one internal-domain message — so the full sync/sanitize/matching/
// exclusion pipeline is exercised without live Microsoft Graph access.
// IDs are deterministic (derived from contact/mailbox, not randomUUID) so
// repeated fetches return the same synthetic messages — the sync engine's
// idempotency (dedup by providerMessageId) needs that to be testable.
export class MockEmailProvider implements EmailProvider {
  async listMessagesSince(mailboxAddress: string, since: Date): Promise<NormalizedEmailMessage[]> {
    const contacts = await db.contact.findMany({
      where: { deletedAt: null, emails: { isEmpty: false } },
      take: 2,
    });

    const mailboxDomain = mailboxAddress.split("@")[1] ?? "heritagetel.com";
    const baseTime = Math.max(since.getTime(), Date.now() - 60 * 60 * 1000);
    const messages: NormalizedEmailMessage[] = [];

    contacts.forEach((contact, index) => {
      const contactEmail = contact.emails[0];
      messages.push({
        providerMessageId: `mock-msg-${mailboxAddress}-${contact.id}`,
        providerThreadId: `mock-thread-${mailboxAddress}-${contact.id}`,
        direction: "INBOUND",
        fromAddress: contactEmail,
        toAddresses: [mailboxAddress],
        ccAddresses: [],
        subject: `Question about our account`,
        bodyText: null,
        bodyHtml: `<p>Hi team,</p><p>Following up on our service — can you confirm the install date?</p><img src="https://tracker.example.com/pixel.gif" width="1" height="1" /><p>Thanks,<br/>${contact.firstName}</p><script>alert('unsafe')</script>`,
        sentAt: new Date(baseTime - index * 60_000),
        attachments: [],
      });
    });

    // An unmatched external sender — should land in the review queue, not
    // silently guessed onto an organization.
    messages.push({
      providerMessageId: `mock-msg-${mailboxAddress}-unmatched`,
      providerThreadId: `mock-thread-${mailboxAddress}-unmatched`,
      direction: "INBOUND",
      fromAddress: "someone.new@example.com",
      toAddresses: [mailboxAddress],
      ccAddresses: [],
      subject: "New inquiry",
      bodyText: "Hi, I'd like to learn more about your services.",
      bodyHtml: null,
      sentAt: new Date(baseTime - 5 * 60_000),
      attachments: [],
    });

    // Internal-domain traffic — should be excluded from customer timelines.
    messages.push({
      providerMessageId: `mock-msg-${mailboxAddress}-internal`,
      providerThreadId: `mock-thread-${mailboxAddress}-internal`,
      direction: "INBOUND",
      fromAddress: `noreply@${mailboxDomain}`,
      toAddresses: [mailboxAddress],
      ccAddresses: [],
      subject: "Internal notice",
      bodyText: "Internal-only distribution.",
      bodyHtml: null,
      sentAt: new Date(baseTime - 10 * 60_000),
      attachments: [],
    });

    return messages;
  }
}
