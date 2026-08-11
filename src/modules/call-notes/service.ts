import { recordAuditEvent } from "@/lib/audit";
import * as callNotesRepo from "@/modules/call-notes/repository";
import * as tasksService from "@/modules/tasks/service";
import type {
  CompleteCallNoteReviewInput,
  CreateCallNoteInput,
} from "@/modules/call-notes/schema";

export async function createCallNote(input: CreateCallNoteInput, actorId: string) {
  const callNote = await callNotesRepo.createCallNote({ ...input, authorId: actorId });

  await recordAuditEvent({
    actorId,
    action: "call_note.create",
    entityType: "CallNote",
    entityId: callNote.id,
    after: callNote,
  });

  // ACT-12: saving a next action can create an assigned CRM task.
  if (input.nextAction) {
    await tasksService.createTask(
      {
        title: input.nextAction,
        organizationId: input.organizationId,
        relatedType: "CallNote",
        relatedId: callNote.id,
        ownerId: actorId,
        dueDate: input.nextActionDueDate,
        priority: "NORMAL",
      },
      actorId,
    );
  }

  return callNote;
}

export function listCallNotes(organizationId?: string) {
  return callNotesRepo.listCallNotes(organizationId);
}

export class CallNoteNotFoundError extends Error {
  constructor() {
    super("Call note not found");
  }
}

export async function completeCallNoteReview(
  id: string,
  input: CompleteCallNoteReviewInput,
  actorId: string,
) {
  const before = await callNotesRepo.findCallNoteById(id);
  if (!before) throw new CallNoteNotFoundError();

  const callNote = await callNotesRepo.completeCallNoteReview(id, actorId, {
    summary: input.summary,
    disposition: input.disposition,
    nextAction: input.nextAction,
  });

  await recordAuditEvent({
    actorId,
    action: "call_note.review_completed",
    entityType: "CallNote",
    entityId: id,
    before: { needsReview: before.needsReview, summary: before.summary },
    after: { needsReview: callNote.needsReview, summary: callNote.summary },
  });

  if (input.nextAction) {
    await tasksService.createTask(
      {
        title: input.nextAction,
        organizationId: callNote.organizationId,
        relatedType: "CallNote",
        relatedId: callNote.id,
        ownerId: actorId,
        dueDate: input.nextActionDueDate,
        priority: "NORMAL",
      },
      actorId,
    );
  }

  return callNote;
}
