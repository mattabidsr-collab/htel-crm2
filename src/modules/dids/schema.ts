import { z } from "zod";
import { DidStatus, E911Status, PortStatus, SmsStatus } from "@prisma/client";

const e164 = z.string().regex(/^\+?[1-9]\d{6,14}$/, "Must be a valid E.164 number");

export const createDidSchema = z.object({
  number: e164,
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  tenDlcCampaignId: z.string().uuid().optional(),
  provider: z.string().optional(),
  status: z.nativeEnum(DidStatus).default(DidStatus.ACTIVE),
  smsStatus: z.nativeEnum(SmsStatus).default(SmsStatus.NOT_ENABLED),
  e911Status: z.nativeEnum(E911Status).default(E911Status.NOT_REQUIRED),
  portStatus: z.nativeEnum(PortStatus).default(PortStatus.NONE),
});

export type CreateDidInput = z.infer<typeof createDidSchema>;

export const listDidsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export type ListDidsQuery = z.infer<typeof listDidsQuerySchema>;
