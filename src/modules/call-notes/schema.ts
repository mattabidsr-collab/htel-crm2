import { z } from "zod";
import { CallDirection } from "@prisma/client";

export const createCallNoteSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  didId: z.string().uuid().optional(),
  occurredAt: z.coerce.date().default(() => new Date()),
  direction: z.nativeEnum(CallDirection),
  participants: z.array(z.string()).default([]),
  summary: z.string().min(1),
  disposition: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDueDate: z.coerce.date().optional(),
});

export type CreateCallNoteInput = z.infer<typeof createCallNoteSchema>;

export const listCallNotesQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

export type ListCallNotesQuery = z.infer<typeof listCallNotesQuerySchema>;

// Completing a review fills in the substantive note on a CDR-sourced draft
// (spec 5.7.6: a human remains responsible for the note and outcome).
export const completeCallNoteReviewSchema = z.object({
  summary: z.string().min(1),
  disposition: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDueDate: z.coerce.date().optional(),
});

export type CompleteCallNoteReviewInput = z.infer<typeof completeCallNoteReviewSchema>;
