import { z } from "zod";
import { ContractStatus, ContractType, RenewalDisposition } from "@prisma/client";

export const createContractSchema = z.object({
  organizationId: z.string().uuid(),
  type: z.nativeEnum(ContractType).default(ContractType.MSA),
  status: z.nativeEnum(ContractStatus).default(ContractStatus.DRAFT),
  signedDate: z.coerce.date().optional(),
  effectiveDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  termMonths: z.coerce.number().int().min(1).optional(),
  autoRenew: z.boolean().default(false),
  noticeDays: z.coerce.number().int().min(0).default(60),
  ownerId: z.string().uuid().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const listContractsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;

// Business rule 6: marking a contract renewed requires new dates and terms.
export const updateContractSchema = z
  .object({
    status: z.nativeEnum(ContractStatus).optional(),
    endDate: z.coerce.date().optional(),
    termMonths: z.coerce.number().int().min(1).optional(),
    noticeDays: z.coerce.number().int().min(0).optional(),
    autoRenew: z.boolean().optional(),
    renewalDisposition: z.nativeEnum(RenewalDisposition).optional(),
    renewalNotes: z.string().optional(),
  })
  .refine((data) => data.renewalDisposition !== "RENEWED" || (data.endDate && data.termMonths), {
    message: "Marking a contract renewed requires a new end date and term",
    path: ["endDate"],
  });

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
