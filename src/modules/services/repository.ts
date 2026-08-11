import { db } from "@/lib/db";
import type { CreateServiceInput, ListServicesQuery } from "@/modules/services/schema";

export function createService(input: CreateServiceInput) {
  return db.service.create({ data: input });
}

export function listServices(query: ListServicesQuery) {
  return db.service.findMany({
    where: { organizationId: query.organizationId },
    include: { site: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}
