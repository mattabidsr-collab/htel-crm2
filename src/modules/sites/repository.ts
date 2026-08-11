import { db } from "@/lib/db";
import type { CreateSiteInput, ListSitesQuery } from "@/modules/sites/schema";

export function createSite(input: CreateSiteInput) {
  return db.site.create({ data: input });
}

export function listSites(query: ListSitesQuery) {
  return db.site.findMany({
    where: { deletedAt: null, organizationId: query.organizationId },
    take: query.take,
    orderBy: { name: "asc" },
  });
}

export function findSiteById(id: string) {
  return db.site.findFirst({ where: { id, deletedAt: null } });
}
