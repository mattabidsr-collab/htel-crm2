import { db } from "@/lib/db";
import { summarizeTickets } from "@/modules/vision/metrics-calc";

export async function getSupportMetrics(organizationId: string) {
  const tickets = await db.visionTicketProjection.findMany({ where: { organizationId } });
  return summarizeTickets(tickets, new Date());
}
