import { db } from "@/lib/db";
import { isActiveAt, summarizeServiceLines } from "@/modules/telecom/calc";

const SEAT_TYPES = ["HOSTED_SEAT", "CONVENIENCE_SEAT"] as const;

export async function calcMrr(organizationId: string, effectiveDate = new Date()) {
  const services = await db.service.findMany({ where: { organizationId } });
  return summarizeServiceLines(
    services.map((s) => ({ ...s, unitPrice: Number(s.unitPrice), unitCost: s.unitCost === null ? null : Number(s.unitCost) })),
    effectiveDate,
  );
}

// TEL-04: calculated active seat and DID counts.
export async function calcSeatAndDidCounts(organizationId: string, effectiveDate = new Date()) {
  const [services, activeDids] = await Promise.all([
    db.service.findMany({ where: { organizationId, type: { in: [...SEAT_TYPES] } } }),
    db.dID.count({ where: { organizationId, status: "ACTIVE" } }),
  ]);

  const activeSeats = services
    .filter((s) => isActiveAt(s, effectiveDate))
    .reduce((sum, s) => sum + s.quantity, 0);

  return { activeSeats, activeDids };
}

export async function captureMrrSnapshot(organizationId: string, periodEnd = new Date()) {
  const { mrr, activeServiceCount } = await calcMrr(organizationId, periodEnd);
  const { activeSeats, activeDids } = await calcSeatAndDidCounts(organizationId, periodEnd);

  return db.mrrSnapshot.create({
    data: {
      organizationId,
      periodEnd,
      mrr,
      activeServices: activeServiceCount,
      activeSeats,
      activeDids,
    },
  });
}
