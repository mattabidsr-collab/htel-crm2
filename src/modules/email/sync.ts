import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { getEmailProvider } from "@/integrations/email/provider";
import { sanitizeEmailHtml } from "@/integrations/email/sanitize";
import type { NormalizedEmailMessage } from "@/integrations/email/types";
import { isExcludedSender, resolveThreadAssociation } from "@/modules/email/matching";

const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

async function buildContactOrgLookup(): Promise<Map<string, string[]>> {
  const contacts = await db.contact.findMany({
    where: { deletedAt: null, emails: { isEmpty: false } },
    include: { affiliations: { select: { organizationId: true } } },
  });

  const lookup = new Map<string, string[]>();
  for (const contact of contacts) {
    const orgIds = contact.affiliations.map((a) => a.organizationId);
    for (const email of contact.emails) {
      lookup.set(email.toLowerCase(), orgIds);
    }
  }
  return lookup;
}

function resolveContactId(
  message: NormalizedEmailMessage,
  contactsByEmail: Map<string, string>,
): string | undefined {
  const primaryEmail = message.direction === "INBOUND" ? message.fromAddress : message.toAddresses[0];
  return primaryEmail ? contactsByEmail.get(primaryEmail.toLowerCase()) : undefined;
}

export async function syncMailbox(mailboxId: string, actorId: string) {
  const mailbox = await db.mailbox.findUniqueOrThrow({ where: { id: mailboxId } });
  const provider = getEmailProvider();
  const since = mailbox.lastSyncedAt ?? new Date(Date.now() - DEFAULT_LOOKBACK_MS);
  const mailboxDomain = mailbox.emailAddress.split("@")[1] ?? "";

  const [messages, contactOrgLookup, contacts] = await Promise.all([
    provider.listMessagesSince(mailbox.emailAddress, since),
    buildContactOrgLookup(),
    db.contact.findMany({ where: { deletedAt: null, emails: { isEmpty: false } } }),
  ]);

  const contactsByEmail = new Map<string, string>();
  for (const contact of contacts) {
    for (const email of contact.emails) contactsByEmail.set(email.toLowerCase(), contact.id);
  }

  let created = 0;
  let skippedExisting = 0;
  const threadCache = new Map<string, { id: string; organizationId: string | null }>();

  for (const message of messages) {
    const existing = await db.emailMessage.findUnique({
      where: { mailboxId_providerMessageId: { mailboxId, providerMessageId: message.providerMessageId } },
    });
    if (existing) {
      skippedExisting += 1;
      continue;
    }

    let thread = threadCache.get(message.providerThreadId);
    if (!thread) {
      const existingThread = await db.emailThread.findUnique({
        where: { mailboxId_providerThreadId: { mailboxId, providerThreadId: message.providerThreadId } },
      });

      if (existingThread) {
        thread = { id: existingThread.id, organizationId: existingThread.organizationId };
      } else {
        const participantEmails = [
          message.fromAddress,
          ...message.toAddresses,
          ...message.ccAddresses,
        ].filter((email) => email.toLowerCase() !== mailbox.emailAddress.toLowerCase());

        const association = resolveThreadAssociation({
          participantEmails,
          contactOrganizations: contactOrgLookup,
          isExcluded: isExcludedSender(message.fromAddress, mailboxDomain),
        });

        const createdThread = await db.emailThread.create({
          data: {
            mailboxId,
            providerThreadId: message.providerThreadId,
            subject: message.subject,
            organizationId: association.organizationId ?? null,
            associationStatus: association.status,
            associationNote: association.note ?? null,
          },
        });
        thread = { id: createdThread.id, organizationId: createdThread.organizationId };
      }
      threadCache.set(message.providerThreadId, thread);
    }

    await db.emailMessage.create({
      data: {
        mailboxId,
        threadId: thread.id,
        providerMessageId: message.providerMessageId,
        direction: message.direction,
        fromAddress: message.fromAddress,
        toAddresses: message.toAddresses,
        ccAddresses: message.ccAddresses,
        subject: message.subject,
        bodyText: message.bodyText,
        bodyHtmlSanitized: message.bodyHtml ? sanitizeEmailHtml(message.bodyHtml) : null,
        sentAt: message.sentAt,
        contactId: resolveContactId(message, contactsByEmail),
        attachments:
          message.attachments.length > 0
            ? (message.attachments as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });
    created += 1;
  }

  await db.mailbox.update({ where: { id: mailboxId }, data: { lastSyncedAt: new Date() } });

  await recordAuditEvent({
    actorId,
    action: "mailbox.synced",
    entityType: "Mailbox",
    entityId: mailboxId,
    after: { created, skippedExisting, messagesFetched: messages.length },
  });

  return { created, skippedExisting, messagesFetched: messages.length };
}

export async function syncAllMailboxes(actorId: string) {
  const mailboxes = await db.mailbox.findMany({ where: { status: "CONNECTED" } });
  const results = [];
  for (const mailbox of mailboxes) {
    results.push({ mailboxId: mailbox.id, ...(await syncMailbox(mailbox.id, actorId)) });
  }
  return results;
}
