import { db } from "@/lib/db";
import type { CreateOrganizationInput, ListOrganizationsQuery } from "@/modules/organizations/schema";

export function createOrganization(input: CreateOrganizationInput) {
  return db.organization.create({ data: input });
}

export function findOrganizationById(id: string) {
  return db.organization.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, name: true } },
    },
  });
}

// ACC-06: duplicate detection checks normalized organization name during entry.
export function findOrganizationsByNormalizedName(normalizedName: string) {
  return db.organization.findMany({
    where: { deletedAt: null, name: { equals: normalizedName, mode: "insensitive" } },
  });
}

export function listOrganizations(query: ListOrganizationsQuery) {
  return db.organization.findMany({
    where: {
      deletedAt: null,
      lifecycleStatus: query.lifecycleStatus,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { legalName: { contains: query.q, mode: "insensitive" } },
              { dba: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    take: query.take,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    orderBy: { name: "asc" },
  });
}
