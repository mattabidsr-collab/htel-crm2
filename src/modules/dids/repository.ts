import { db } from "@/lib/db";
import type { CreateDidInput, ListDidsQuery } from "@/modules/dids/schema";

export function createDid(input: CreateDidInput) {
  return db.dID.create({ data: input });
}

export function findDidByNumber(number: string) {
  return db.dID.findUnique({ where: { number } });
}

export function listDids(query: ListDidsQuery) {
  return db.dID.findMany({
    where: { organizationId: query.organizationId },
    include: { tenDlcCampaign: { select: { id: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });
}
