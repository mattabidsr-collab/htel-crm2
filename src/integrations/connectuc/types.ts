// Normalized shapes core business logic depends on — never the raw
// ConnectUC webhook payload delivered via Activepieces (spec section 10:
// "Core business logic must not depend directly on a vendor-specific
// payload").

export interface NormalizedConnectUcCdrEvent {
  externalCallId: string; // origCallid — primary correlation key
  terminatingCallId: string | null; // termCallid — secondary correlation key for transcripts
  direction: "INBOUND" | "OUTBOUND";
  fromNumber: string;
  toNumber: string;
  occurredAt: Date;
  durationSeconds: number;
  missed: boolean;
  disposition: string | null;
}

export interface NormalizedTranscriptSegment {
  speaker: string;
  text: string;
  startTime: string;
  endTime: string;
}

export interface NormalizedConnectUcTranscriptionEvent {
  transcriptId: string;
  cdrId: string | null;
  callId: string | null;
  segments: NormalizedTranscriptSegment[];
  summary: string | null;
  status: string | null;
}
