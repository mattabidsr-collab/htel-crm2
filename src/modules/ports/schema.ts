import { z } from "zod";
import { PortProjectStatus } from "@prisma/client";

export const createPortProjectSchema = z.object({
  organizationId: z.string().uuid(),
  losingCarrier: z.string().optional(),
  status: z.nativeEnum(PortProjectStatus).default(PortProjectStatus.DRAFT),
  requestedDate: z.coerce.date().optional(),
  didNumbers: z.array(z.string().min(1)).min(1),
});

export type CreatePortProjectInput = z.infer<typeof createPortProjectSchema>;
