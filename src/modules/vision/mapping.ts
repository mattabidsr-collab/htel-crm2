import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export function listUnmappedIdentities() {
  return db.visionIdentityMapping.findMany({
    where: { status: "UNMAPPED" },
    orderBy: { lastSeenAt: "desc" },
  });
}

export class MappingNotFoundError extends Error {
  constructor() {
    super("Vision identity mapping not found");
  }
}

// SUP-07: unmapped Vision customer identities get a manual-mapping action.
// Backfills organizationId onto already-synced tickets for this customer
// so the review action takes effect immediately, not on the next sync.
export async function mapIdentity(mappingId: string, organizationId: string, actorId: string) {
  const before = await db.visionIdentityMapping.findUnique({ where: { id: mappingId } });
  if (!before) throw new MappingNotFoundError();

  const [mapping] = await db.$transaction([
    db.visionIdentityMapping.update({
      where: { id: mappingId },
      data: { organizationId, status: "MAPPED" },
    }),
    db.visionTicketProjection.updateMany({
      where: { externalCustomerId: before.externalCustomerId },
      data: { organizationId },
    }),
  ]);

  await recordAuditEvent({
    actorId,
    action: "vision_identity.mapped",
    entityType: "VisionIdentityMapping",
    entityId: mappingId,
    before: { status: before.status, organizationId: before.organizationId },
    after: { status: mapping.status, organizationId: mapping.organizationId },
  });

  return mapping;
}

export async function ignoreIdentity(mappingId: string, actorId: string) {
  const before = await db.visionIdentityMapping.findUnique({ where: { id: mappingId } });
  if (!before) throw new MappingNotFoundError();

  const mapping = await db.visionIdentityMapping.update({
    where: { id: mappingId },
    data: { status: "IGNORED" },
  });

  await recordAuditEvent({
    actorId,
    action: "vision_identity.ignored",
    entityType: "VisionIdentityMapping",
    entityId: mappingId,
    before: { status: before.status },
    after: { status: mapping.status },
  });

  return mapping;
}
