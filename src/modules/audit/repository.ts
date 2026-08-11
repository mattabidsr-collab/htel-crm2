import { db } from "@/lib/db";

export interface AuditEventFilters {
  entityType?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  take: number;
}

export function listAuditEvents(filters: AuditEventFilters) {
  return db.auditEvent.findMany({
    where: {
      entityType: filters.entityType || undefined,
      actorId: filters.actorId || undefined,
      occurredAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { occurredAt: "desc" },
    take: filters.take,
  });
}

export function listDistinctEntityTypes() {
  return db.auditEvent.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
  });
}

export function listActorsForFilter() {
  return db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}
