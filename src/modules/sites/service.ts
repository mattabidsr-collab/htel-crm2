import { recordAuditEvent } from "@/lib/audit";
import * as sitesRepo from "@/modules/sites/repository";
import type { CreateSiteInput, ListSitesQuery } from "@/modules/sites/schema";

export async function createSite(input: CreateSiteInput, actorId: string) {
  const site = await sitesRepo.createSite(input);

  await recordAuditEvent({
    actorId,
    action: "site.create",
    entityType: "Site",
    entityId: site.id,
    after: site,
  });

  return site;
}

export function listSites(query: ListSitesQuery) {
  return sitesRepo.listSites(query);
}

export function getSite(id: string) {
  return sitesRepo.findSiteById(id);
}
