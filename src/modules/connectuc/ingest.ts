import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import {
  formatTranscriptText,
  normalizeCdrEvent,
  normalizeTranscriptionEvent,
  phoneNumberCandidates,
} from "@/integrations/connectuc/normalize";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

// Idempotent on origCallid (externalCallId): a redelivered CDR webhook is a
// no-op. Numbers are matched against the DID inventory across every
// organization — ConnectUC's webhook isn't scoped to a single platform
// account/domain the way the old poll-based SkySwitch sync was, so
// attribution works purely off which DID appears as either party on the
// call. An unmatched call is logged, never guessed (same philosophy as the
// email/Vision review queues).
export async function ingestConnectUcCdrEvent(raw: Record<string, unknown>) {
  const event = normalizeCdrEvent(raw);

  const existing = await db.callNote.findUnique({ where: { externalCallId: event.externalCallId } });
  if (existing) return { status: "duplicate" as const, callNoteId: existing.id };

  const fromCandidates = phoneNumberCandidates(event.fromNumber);
  const toCandidates = phoneNumberCandidates(event.toNumber);
  const did = await db.dID.findFirst({
    where: { number: { in: [...fromCandidates, ...toCandidates] } },
  });
  if (!did) {
    await recordAuditEvent({
      actorId: null,
      action: "connectuc.cdr.unmatched",
      entityType: "CallNote",
      after: {
        fromNumber: event.fromNumber,
        toNumber: event.toNumber,
        externalCallId: event.externalCallId,
      },
    });
    return { status: "unmatched" as const };
  }

  const externalNumber = fromCandidates.includes(did.number) ? event.toNumber : event.fromNumber;

  const callNote = await db.callNote.create({
    data: {
      organizationId: did.organizationId,
      didId: did.id,
      occurredAt: event.occurredAt,
      direction: event.direction,
      participants: [externalNumber],
      summary:
        `${event.direction === "INBOUND" ? "Inbound" : "Outbound"} call via ${did.number}, ` +
        `${formatDuration(event.durationSeconds)}${event.missed ? " (missed)" : ""} — needs review`,
      source: "CONNECTUC",
      needsReview: true,
      durationSeconds: event.durationSeconds,
      externalCallId: event.externalCallId,
      terminatingCallId: event.terminatingCallId,
    },
  });

  await recordAuditEvent({
    actorId: null,
    action: "call_note.synced_from_connectuc_cdr",
    entityType: "CallNote",
    entityId: callNote.id,
    after: callNote,
  });

  return { status: "created" as const, callNoteId: callNote.id };
}

// A transcription webhook attaches to whichever CallNote its CDR event
// already created, matched by either correlation ID ConnectUC provides
// (cdrId or callId — checked against both externalCallId and
// terminatingCallId, since which call leg's ID ConnectUC echoes back on
// the transcript event isn't confirmed). If no matching CDR note exists
// yet — e.g. the transcript webhook arrives before the CDR one, or the
// correlation IDs don't line up the way assumed here — the transcript is
// logged and dropped rather than created as an orphan: CallNote.
// organizationId is required, and there's nothing here to attribute it to
// without guessing. If this turns out to happen often in practice, add an
// unattributed-transcript review queue (same pattern as the Vision
// identity queue) instead of silently dropping.
export async function ingestConnectUcTranscriptionEvent(raw: Record<string, unknown>) {
  const event = normalizeTranscriptionEvent(raw);
  const candidateIds = [event.cdrId, event.callId].filter((id): id is string => Boolean(id));

  const callNote =
    candidateIds.length > 0
      ? await db.callNote.findFirst({
          where: {
            OR: [{ externalCallId: { in: candidateIds } }, { terminatingCallId: { in: candidateIds } }],
          },
        })
      : null;

  if (!callNote) {
    await recordAuditEvent({
      actorId: null,
      action: "connectuc.transcript.unmatched",
      entityType: "CallNote",
      after: { transcriptId: event.transcriptId, cdrId: event.cdrId, callId: event.callId },
    });
    return { status: "unmatched" as const };
  }

  const transcriptText = formatTranscriptText(event.segments);

  const updated = await db.callNote.update({
    where: { id: callNote.id },
    data: {
      transcriptText,
      transcriptSegments: event.segments as unknown as Prisma.InputJsonValue,
      transcriptSummary: event.summary,
    },
  });

  await recordAuditEvent({
    actorId: null,
    action: "call_note.transcript_attached",
    entityType: "CallNote",
    entityId: updated.id,
    after: { transcriptSummary: updated.transcriptSummary, segmentCount: event.segments.length },
  });

  return { status: "attached" as const, callNoteId: updated.id };
}
