import { z } from "zod";
import { ContactRole } from "@prisma/client";

export const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  emails: z.array(z.string().email()).default([]),
  phones: z.array(z.string()).default([]),
  preferredChannel: z.string().optional(),
  emailOptIn: z.boolean().default(false),
  smsOptIn: z.boolean().default(false),
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  role: z.nativeEnum(ContactRole),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const listContactsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
