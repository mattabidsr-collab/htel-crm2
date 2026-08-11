import { z } from "zod";
import { TenDlcStatus } from "@prisma/client";

export const createTenDlcBrandSchema = z.object({
  organizationId: z.string().uuid(),
  providerBrandId: z.string().optional(),
  legalName: z.string().optional(),
  status: z.nativeEnum(TenDlcStatus).default(TenDlcStatus.DRAFT),
});

export type CreateTenDlcBrandInput = z.infer<typeof createTenDlcBrandSchema>;

export const createTenDlcCampaignSchema = z.object({
  providerCampaignId: z.string().optional(),
  useCase: z.string().optional(),
  status: z.nativeEnum(TenDlcStatus).default(TenDlcStatus.DRAFT),
  rejectionReason: z.string().optional(),
  reviewDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
});

export type CreateTenDlcCampaignInput = z.infer<typeof createTenDlcCampaignSchema>;
