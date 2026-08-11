import { describe, expect, it } from "vitest";

import {
  InvalidConnectUcPayloadError,
  formatTranscriptText,
  normalizeCdrEvent,
  normalizeTranscriptionEvent,
  phoneNumberCandidates,
} from "@/integrations/connectuc/normalize";

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

describe("normalizeCdrEvent", () => {
  const validRaw = {
    fromNumber: "17869811611",
    fromLabel: "Example",
    toNumber: "7862881235",
    toLabel: "7862881234",
    duration: 8,
    direction: "outgoing",
    dateTime: "2025-11-06T14:07:59.000Z",
    origCallid: "orig-123",
    termCallid: "term-456",
    missed: false,
    disposition: null,
  };

  it("maps confirmed ConnectUC CDR fields to the normalized shape", () => {
    const result = normalizeCdrEvent(validRaw);
    expect(result).toEqual({
      externalCallId: "orig-123",
      terminatingCallId: "term-456",
      direction: "OUTBOUND",
      fromNumber: "17869811611",
      toNumber: "7862881235",
      occurredAt: new Date("2025-11-06T14:07:59.000Z"),
      durationSeconds: 8,
      missed: false,
      disposition: null,
    });
  });

  it("maps incoming direction to INBOUND", () => {
    const result = normalizeCdrEvent({ ...validRaw, direction: "incoming" });
    expect(result.direction).toBe("INBOUND");
  });

  it("throws on a missing origCallid", () => {
    expect(() => normalizeCdrEvent(omit(validRaw, "origCallid"))).toThrow(InvalidConnectUcPayloadError);
  });

  it("throws on missing caller/callee numbers", () => {
    expect(() => normalizeCdrEvent(omit(validRaw, "fromNumber"))).toThrow(InvalidConnectUcPayloadError);
  });
});

describe("normalizeTranscriptionEvent", () => {
  const validRaw = {
    id: "transcript-1",
    cdrId: "cdr-1",
    callId: "call-1",
    comments: [
      { speaker: "Karina Taylor", comment: "press 1.", startTime: "00:00:08,24", endTime: "00:00:09,03" },
      { speaker: "Agent", comment: "one moment please", startTime: "00:00:10,00", endTime: "00:00:11,50" },
    ],
    summary: null,
    status: "finished",
  };

  it("normalizes segments in order", () => {
    const result = normalizeTranscriptionEvent(validRaw);
    expect(result.segments).toEqual([
      { speaker: "Karina Taylor", text: "press 1.", startTime: "00:00:08,24", endTime: "00:00:09,03" },
      { speaker: "Agent", text: "one moment please", startTime: "00:00:10,00", endTime: "00:00:11,50" },
    ]);
    expect(result.cdrId).toBe("cdr-1");
    expect(result.callId).toBe("call-1");
  });

  it("drops comment entries with no text", () => {
    const result = normalizeTranscriptionEvent({
      ...validRaw,
      comments: [...validRaw.comments, { speaker: "Silence", comment: "" }],
    });
    expect(result.segments).toHaveLength(2);
  });

  it("throws on a missing id", () => {
    expect(() => normalizeTranscriptionEvent(omit(validRaw, "id"))).toThrow(InvalidConnectUcPayloadError);
  });

  it("tolerates a missing comments array", () => {
    const result = normalizeTranscriptionEvent(omit(validRaw, "comments"));
    expect(result.segments).toEqual([]);
  });
});

describe("formatTranscriptText", () => {
  it("joins segments as speaker-prefixed lines", () => {
    const text = formatTranscriptText([
      { speaker: "Karina Taylor", text: "press 1.", startTime: "", endTime: "" },
      { speaker: "Agent", text: "one moment please", startTime: "", endTime: "" },
    ]);
    expect(text).toBe("Karina Taylor: press 1.\nAgent: one moment please");
  });
});

describe("phoneNumberCandidates", () => {
  it("generates E.164 and bare-11-digit variants for a bare 10-digit number", () => {
    expect(phoneNumberCandidates("3135551111")).toEqual(
      expect.arrayContaining(["3135551111", "+13135551111", "13135551111"]),
    );
  });

  it("generates E.164 and bare-10-digit variants for an 11-digit number with a leading 1", () => {
    expect(phoneNumberCandidates("13135551111")).toEqual(
      expect.arrayContaining(["13135551111", "+13135551111", "3135551111"]),
    );
  });

  it("matches how ConnectUC's confirmed CDR example formats numbers against a stored E.164 DID", () => {
    // ConnectUC's own doc example: fromNumber "17869811611" (11 digits, no "+").
    expect(phoneNumberCandidates("17869811611")).toContain("+17869811611");
  });
});
