import { z } from "zod";
import { PlatformProvider } from "@prisma/client";

export const createPlatformAccountSchema = z.object({
  organizationId: z.string().uuid(),
  provider: z.nativeEnum(PlatformProvider),
  providerAccountId: z.string().optional(),
  subAccountId: z.string().optional(),
  resellerId: z.string().optional(),
  netsapiensDomain: z.string().optional(),
});

export type CreatePlatformAccountInput = z.infer<typeof createPlatformAccountSchema>;

export const listPlatformAccountsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export type ListPlatformAccountsQuery = z.infer<typeof listPlatformAccountsQuerySchema>;
