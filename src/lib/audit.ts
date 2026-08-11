import { db } from "@/lib/db";

interface RecordAuditEventInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
}

/**
 * Every create, update, delete, import, export, login, and permission change
 * must be auditable by actor and timestamp (ADM-03).
 */
export async function recordAuditEvent(input: RecordAuditEventInput) {
  return db.auditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before === undefined ? undefined : (input.before as object),
      after: input.after === undefined ? undefined : (input.after as object),
      ipAddress: input.ipAddress,
    },
  });
}
