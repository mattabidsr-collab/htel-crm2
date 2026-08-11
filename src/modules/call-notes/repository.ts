import { db } from "@/lib/db";
import type { CreateCallNoteInput } from "@/modules/call-notes/schema";

export function createCallNote(input: CreateCallNoteInput & { authorId: string }) {
  const { nextActionDueDate, ...data } = input;
  void nextActionDueDate; // consumed by the task created alongside this call note, not stored on it
  return db.callNote.create({ data });
}

export function listCallNotes(organizationId?: string) {
  return db.callNote.findMany({
    where: { organizationId },
    include: {
      author: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { occurredAt: "desc" },
  });
}

export function findCallNoteById(id: string) {
  return db.callNote.findUnique({ where: { id } });
}

export function completeCallNoteReview(
  id: string,
  authorId: string,
  data: { summary: string; disposition?: string; nextAction?: string },
) {
  return db.callNote.update({
    where: { id },
    data: { ...data, needsReview: false, authorId },
  });
}
