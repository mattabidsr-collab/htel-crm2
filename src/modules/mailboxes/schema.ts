import { z } from "zod";
import { MailboxProvider } from "@prisma/client";

export const createMailboxSchema = z.object({
  emailAddress: z.string().email(),
  provider: z.nativeEnum(MailboxProvider),
});

export type CreateMailboxInput = z.infer<typeof createMailboxSchema>;
