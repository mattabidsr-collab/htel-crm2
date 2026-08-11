import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export function listReviewQueue() {
  return db.emailThread.findMany({
    where: { associationStatus: { in: ["PENDING", "AMBIGUOUS"] } },
    include: {
      mailbox: { select: { emailAddress: true } },
      messages: { orderBy: { sentAt: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export class ThreadNotFoundError extends Error {
  constructor() {
    super("Email thread not found");
  }
}

// ACT-10: an authorized user can manually associate, reassign, or exclude
// an email with an auditable reason.
export async function associateThread(
  threadId: string,
  organizationId: string,
  actorId: string,
  reason?: string,
) {
  const before = await db.emailThread.findUnique({ where: { id: threadId } });
  if (!before) throw new ThreadNotFoundError();

  const thread = await db.emailThread.update({
    where: { id: threadId },
    data: {
      organizationId,
      associationStatus: "ASSOCIATED",
      associationNote: reason ?? "Manually associated",
    },
  });

  await recordAuditEvent({
    actorId,
    action: "email_thread.associated",
    entityType: "EmailThread",
    entityId: threadId,
    before: { associationStatus: before.associationStatus, organizationId: before.organizationId },
    after: { associationStatus: thread.associationStatus, organizationId: thread.organizationId },
  });

  return thread;
}

export async function excludeThread(threadId: string, actorId: string, reason?: string) {
  const before = await db.emailThread.findUnique({ where: { id: threadId } });
  if (!before) throw new ThreadNotFoundError();

  const thread = await db.emailThread.update({
    where: { id: threadId },
    data: { organizationId: null, associationStatus: "EXCLUDED", associationNote: reason ?? "Manually excluded" },
  });

  await recordAuditEvent({
    actorId,
    action: "email_thread.excluded",
    entityType: "EmailThread",
    entityId: threadId,
    before: { associationStatus: before.associationStatus },
    after: { associationStatus: thread.associationStatus },
  });

  return thread;
}
