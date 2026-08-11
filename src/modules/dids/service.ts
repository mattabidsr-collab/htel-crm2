import { recordAuditEvent } from "@/lib/audit";
import * as didsRepo from "@/modules/dids/repository";
import type { CreateDidInput, ListDidsQuery } from "@/modules/dids/schema";

export class DuplicateDidError extends Error {
  constructor() {
    super("This number is already in inventory");
  }
}

export async function createDid(input: CreateDidInput, actorId: string) {
  const existing = await didsRepo.findDidByNumber(input.number);
  if (existing) throw new DuplicateDidError();

  const did = await didsRepo.createDid(input);

  await recordAuditEvent({
    actorId,
    action: "did.create",
    entityType: "DID",
    entityId: did.id,
    after: did,
  });

  return did;
}

export function listDids(query: ListDidsQuery) {
  return didsRepo.listDids(query);
}
