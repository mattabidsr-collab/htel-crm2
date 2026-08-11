import type {
  NormalizedConnectUcCdrEvent,
  NormalizedConnectUcTranscriptionEvent,
  NormalizedTranscriptSegment,
} from "@/integrations/connectuc/types";

/**
 * Pure functions turning ConnectUC's raw webhook payloads (forwarded by an
 * Activepieces flow) into the normalized shapes above.
 *
 * CONFIRMED (from the ConnectUC piece's own source in the Activepieces
 * repo — `packages/pieces/community/connectuc` — not a guess): the CDR
 * webhook ("New CDR" trigger) carries `fromNumber`, `toNumber`, `duration`
 * (seconds), `direction` ("incoming"/"outgoing"), `dateTime` (ISO 8601),
 * `origCallid`, `termCallid`, `missed` (boolean), and `disposition`.
 *
 * PARTIALLY CONFIRMED: the transcription webhook ("New Call Transcription"
 * trigger) carries `id`, `cdrId`, `callId`, a `comments[]` array of
 * speaker-attributed segments, a `summary`, and `status`. The exact field
 * name for each comment's transcribed text/speaker was described but not
 * shown as raw JSON, so this reads defensively with fallback field names
 * rather than failing closed on a shape that turns out slightly different
 * once real ConnectUC traffic arrives.
 */
export class InvalidConnectUcPayloadError extends Error {}

export function normalizeCdrEvent(raw: Record<string, unknown>): NormalizedConnectUcCdrEvent {
  const { origCallid, fromNumber, toNumber } = raw;
  if (typeof origCallid !== "string" || !origCallid) {
    throw new InvalidConnectUcPayloadError("CDR event missing origCallid");
  }
  if (typeof fromNumber !== "string" || typeof toNumber !== "string") {
    throw new InvalidConnectUcPayloadError("CDR event missing fromNumber/toNumber");
  }

  const direction = String(raw.direction ?? "").toLowerCase() === "incoming" ? "INBOUND" : "OUTBOUND";

  return {
    externalCallId: origCallid,
    terminatingCallId: typeof raw.termCallid === "string" ? raw.termCallid : null,
    direction,
    fromNumber,
    toNumber,
    occurredAt: raw.dateTime ? new Date(String(raw.dateTime)) : new Date(),
    durationSeconds: Number(raw.duration ?? 0),
    missed: Boolean(raw.missed),
    disposition: raw.disposition ? String(raw.disposition) : null,
  };
}

export function normalizeTranscriptionEvent(
  raw: Record<string, unknown>,
): NormalizedConnectUcTranscriptionEvent {
  const id = raw.id;
  if (typeof id !== "string" || !id) {
    throw new InvalidConnectUcPayloadError("Transcription event missing id");
  }

  const rawComments = Array.isArray(raw.comments) ? raw.comments : [];
  const segments = rawComments
    .map((entry): NormalizedTranscriptSegment | null => {
      const row = entry as Record<string, unknown>;
      const text = row.comment ?? row.text;
      if (!text) return null;
      return {
        speaker: String(row.speaker ?? row.speakerName ?? "Unknown"),
        text: String(text),
        startTime: row.startTime ? String(row.startTime) : "",
        endTime: row.endTime ? String(row.endTime) : "",
      };
    })
    .filter((segment): segment is NormalizedTranscriptSegment => segment !== null);

  return {
    transcriptId: id,
    cdrId: typeof raw.cdrId === "string" ? raw.cdrId : null,
    callId: typeof raw.callId === "string" ? raw.callId : null,
    segments,
    summary: raw.summary ? String(raw.summary) : null,
    status: raw.status ? String(raw.status) : null,
  };
}

export function formatTranscriptText(segments: NormalizedTranscriptSegment[]): string {
  return segments.map((segment) => `${segment.speaker}: ${segment.text}`).join("\n");
}

// DIDs are stored E.164 (+13135551111), but ConnectUC's confirmed CDR
// example sends bare digits ("17869811611", no "+") — found by live
// testing, not by inspection. Rather than reformat stored DIDs, generate
// every plausible variant of the incoming number and match any of them.
export function phoneNumberCandidates(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  const candidates = new Set<string>([raw, digits]);
  if (digits.length === 10) {
    candidates.add(`+1${digits}`);
    candidates.add(`1${digits}`);
  } else if (digits.length === 11 && digits.startsWith("1")) {
    candidates.add(`+${digits}`);
    candidates.add(digits.slice(1));
  }
  return [...candidates];
}
