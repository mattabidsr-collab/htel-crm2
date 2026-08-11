import { z } from "zod";
import { SiteStatus } from "@prisma/client";

export const createSiteSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  status: z.nativeEnum(SiteStatus).default(SiteStatus.PENDING),
  timezone: z.string().default("America/Detroit"),
  serviceAddressLine1: z.string().optional(),
  serviceAddressLine2: z.string().optional(),
  serviceCity: z.string().optional(),
  serviceState: z.string().optional(),
  servicePostalCode: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  dispatchableAddressLine1: z.string().optional(),
  dispatchableAddressLine2: z.string().optional(),
  dispatchableCity: z.string().optional(),
  dispatchableState: z.string().optional(),
  dispatchablePostalCode: z.string().optional(),
  siteContactId: z.string().uuid().optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

export const listSitesQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListSitesQuery = z.infer<typeof listSitesQuerySchema>;
