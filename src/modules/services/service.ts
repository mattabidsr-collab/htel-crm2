import { recordAuditEvent } from "@/lib/audit";
import * as servicesRepo from "@/modules/services/repository";
import type { CreateServiceInput, ListServicesQuery } from "@/modules/services/schema";

export async function createService(input: CreateServiceInput, actorId: string) {
  const service = await servicesRepo.createService(input);

  await recordAuditEvent({
    actorId,
    action: "service.create",
    entityType: "Service",
    entityId: service.id,
    after: service,
  });

  return service;
}

export function listServices(query: ListServicesQuery) {
  return servicesRepo.listServices(query);
}
