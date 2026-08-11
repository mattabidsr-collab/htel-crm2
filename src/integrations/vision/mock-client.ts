import { db } from "@/lib/db";
import type { NormalizedVisionTicket, VisionClient } from "@/integrations/vision/types";

// Generates realistic-looking tickets against real organizations, with no
// external dependency — exercises the full sync/identity-mapping/review
// pipeline without live Vision Helpdesk access. IDs are deterministic
// (derived from the organization, not random) so repeated fetches return
// the same synthetic tickets and idempotent sync is actually testable.
// Uses the real mask-ID + numeric-ID deep-link shape confirmed against
// Heritage's live instance.
export class MockVisionClient implements VisionClient {
  async fetchRecentTickets(since: Date): Promise<NormalizedVisionTicket[]> {
    const organizations = await db.organization.findMany({
      where: { deletedAt: null },
      take: 2,
    });
    if (organizations.length === 0) return [];

    const baseTime = Math.max(since.getTime(), Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tickets: NormalizedVisionTicket[] = [];

    organizations.forEach((org, orgIndex) => {
      const customerId = `vision-cust-${org.id}`;
      const maskPrefix = `MOCK-${org.id.slice(0, 4).toUpperCase()}`;

      // Two tickets per org: one open, one resolved — enough to exercise
      // open-count and repeat-issue metrics.
      tickets.push({
        externalTicketId: `${maskPrefix}-1`,
        externalNumericId: String(100000 + orgIndex * 2),
        externalUrl: `https://heritage.visionhelpdesk.com/manage/#/ticket/ticket_details/${maskPrefix}-1/${100000 + orgIndex * 2}`,
        subject: "Fax line intermittently failing",
        status: "open",
        isOpen: true,
        priority: "high",
        category: "Technical",
        requesterName: "Site contact",
        technician: "J. Rivera",
        externalCustomerId: customerId,
        externalCustomerName: org.name,
        visionCreatedAt: new Date(baseTime - orgIndex * 3_600_000),
        visionUpdatedAt: new Date(baseTime - orgIndex * 1_800_000),
      });
      tickets.push({
        externalTicketId: `${maskPrefix}-2`,
        externalNumericId: String(100001 + orgIndex * 2),
        externalUrl: `https://heritage.visionhelpdesk.com/manage/#/ticket/ticket_details/${maskPrefix}-2/${100001 + orgIndex * 2}`,
        subject: "Add a new seat",
        status: "resolved",
        isOpen: false,
        priority: "normal",
        category: "Provisioning",
        requesterName: "Site contact",
        technician: "J. Rivera",
        externalCustomerId: customerId,
        externalCustomerName: org.name,
        visionCreatedAt: new Date(baseTime - 2 * 24 * 60 * 60 * 1000),
        visionUpdatedAt: new Date(baseTime - 1 * 24 * 60 * 60 * 1000),
        visionResolvedAt: new Date(baseTime - 1 * 24 * 60 * 60 * 1000),
      });
    });

    return tickets;
  }
}
