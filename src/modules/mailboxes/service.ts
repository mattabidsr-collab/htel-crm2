import { recordAuditEvent } from "@/lib/audit";
import * as mailboxesRepo from "@/modules/mailboxes/repository";
import type { CreateMailboxInput } from "@/modules/mailboxes/schema";

export class DuplicateMailboxError extends Error {
  constructor() {
    super("This mailbox is already connected");
  }
}

export async function createMailbox(input: CreateMailboxInput, actorId: string) {
  const existing = await mailboxesRepo.findMailboxByEmail(input.emailAddress);
  if (existing) throw new DuplicateMailboxError();

  const mailbox = await mailboxesRepo.createMailbox(input, actorId);

  await recordAuditEvent({
    actorId,
    action: "mailbox.connected",
    entityType: "Mailbox",
    entityId: mailbox.id,
    after: mailbox,
  });

  return mailbox;
}

export function listMailboxes() {
  return mailboxesRepo.listMailboxes();
}
