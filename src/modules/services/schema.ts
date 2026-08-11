import { z } from "zod";
import { ServiceStatus, ServiceType } from "@prisma/client";

export const createServiceSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  platformAccountId: z.string().uuid().optional(),
  type: z.nativeEnum(ServiceType),
  tier: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.PENDING),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0).optional(),
  vendor: z.string().optional(),
  vendorSku: z.string().optional(),
  activationDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const listServicesQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
