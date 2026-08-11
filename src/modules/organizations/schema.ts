import { z } from "zod";
import { LifecycleStatus, OrganizationType } from "@prisma/client";

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  dba: z.string().optional(),
  parentId: z.string().uuid().optional(),
  types: z.array(z.nativeEnum(OrganizationType)).min(1),
  vertical: z.string().optional(),
  lifecycleStatus: z.nativeEnum(LifecycleStatus).default(LifecycleStatus.PROSPECT),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const listOrganizationsQuerySchema = z.object({
  q: z.string().optional(),
  lifecycleStatus: z.nativeEnum(LifecycleStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().uuid().optional(),
});

export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>;
