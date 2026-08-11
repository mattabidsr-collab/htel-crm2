import { db } from "@/lib/db";

export function listAssociatedThreads(organizationId: string) {
  return db.emailThread.findMany({
    where: { organizationId, associationStatus: "ASSOCIATED" },
    include: {
      mailbox: { select: { emailAddress: true } },
      messages: { orderBy: { sentAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
