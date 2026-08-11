import { recordAuditEvent } from "@/lib/audit";
import * as organizationsRepo from "@/modules/organizations/repository";
import type { CreateOrganizationInput, ListOrganizationsQuery } from "@/modules/organizations/schema";

export class DuplicateOrganizationError extends Error {
  constructor(public existingId: string) {
    super("An organization with this name already exists");
  }
}

export async function createOrganization(input: CreateOrganizationInput, actorId: string) {
  // ACC-06: duplicate detection on normalized name during entry.
  const duplicates = await organizationsRepo.findOrganizationsByNormalizedName(input.name.trim());
  if (duplicates.length > 0) {
    throw new DuplicateOrganizationError(duplicates[0].id);
  }

  const organization = await organizationsRepo.createOrganization({
    ...input,
    name: input.name.trim(),
  });

  await recordAuditEvent({
    actorId,
    action: "organization.create",
    entityType: "Organization",
    entityId: organization.id,
    after: organization,
  });

  return organization;
}

export function listOrganizations(query: ListOrganizationsQuery) {
  return organizationsRepo.listOrganizations(query);
}

export function getOrganization(id: string) {
  return organizationsRepo.findOrganizationById(id);
}
