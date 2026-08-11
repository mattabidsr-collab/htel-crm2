import { db } from "@/lib/db";
import type { CreateMailboxInput } from "@/modules/mailboxes/schema";

export function createMailbox(input: CreateMailboxInput, connectedByUserId: string) {
  return db.mailbox.create({ data: { ...input, connectedByUserId } });
}

export function listMailboxes() {
  return db.mailbox.findMany({ orderBy: { createdAt: "asc" } });
}

export function findMailboxByEmail(emailAddress: string) {
  return db.mailbox.findUnique({ where: { emailAddress } });
}

export function touchLastSynced(id: string) {
  return db.mailbox.update({ where: { id }, data: { lastSyncedAt: new Date() } });
}
