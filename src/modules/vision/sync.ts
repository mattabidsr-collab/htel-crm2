import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { getVisionClient } from "@/integrations/vision/client";

const DEFAULT_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

// SUP-05: idempotent sync that updates existing projections rather than
// creating duplicates, keyed on Vision's immutable externalTicketId.
// SUP-03/SUP-06: unmapped Vision customer identities are tracked but the
// ticket itself stays unattributed (organizationId null) until a human
// maps it — never guessed.
export async function syncVisionTickets(actorId: string) {
  const client = getVisionClient();
  const since = new Date(Date.now() - DEFAULT_LOOKBACK_MS);
  const tickets = await client.fetchRecentTickets(since);

  let created = 0;
  let updated = 0;
  let newIdentities = 0;

  for (const ticket of tickets) {
    let mapping = await db.visionIdentityMapping.findUnique({
      where: { externalCustomerId: ticket.externalCustomerId },
    });

    if (!mapping) {
      mapping = await db.visionIdentityMapping.create({
        data: {
          externalCustomerId: ticket.externalCustomerId,
          externalCustomerName: ticket.externalCustomerName,
        },
      });
      newIdentities += 1;
    } else {
      await db.visionIdentityMapping.update({
        where: { id: mapping.id },
        data: { lastSeenAt: new Date(), externalCustomerName: ticket.externalCustomerName },
      });
    }

    const organizationId = mapping.status === "MAPPED" ? mapping.organizationId : null;

    const existing = await db.visionTicketProjection.findUnique({
      where: { externalTicketId: ticket.externalTicketId },
    });

    await db.visionTicketProjection.upsert({
      where: { externalTicketId: ticket.externalTicketId },
      create: {
        externalTicketId: ticket.externalTicketId,
        externalUrl: ticket.externalUrl,
        externalCustomerId: ticket.externalCustomerId,
        subject: ticket.subject,
        status: ticket.status,
        isOpen: ticket.isOpen,
        priority: ticket.priority,
        category: ticket.category,
        requesterEmail: ticket.requesterEmail,
        requesterName: ticket.requesterName,
        technician: ticket.technician,
        organizationId,
        visionCreatedAt: ticket.visionCreatedAt,
        visionUpdatedAt: ticket.visionUpdatedAt,
        visionResolvedAt: ticket.visionResolvedAt,
        syncedAt: new Date(),
      },
      update: {
        subject: ticket.subject,
        status: ticket.status,
        isOpen: ticket.isOpen,
        priority: ticket.priority,
        category: ticket.category,
        requesterEmail: ticket.requesterEmail,
        requesterName: ticket.requesterName,
        technician: ticket.technician,
        organizationId,
        visionUpdatedAt: ticket.visionUpdatedAt,
        visionResolvedAt: ticket.visionResolvedAt,
        syncedAt: new Date(),
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  await recordAuditEvent({
    actorId,
    action: "vision.synced",
    entityType: "VisionTicketProjection",
    after: { ticketsFetched: tickets.length, created, updated, newIdentities },
  });

  return { ticketsFetched: tickets.length, created, updated, newIdentities };
}
