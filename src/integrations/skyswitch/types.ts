// Normalized shape core business logic depends on — never the raw vendor
// payload (spec section 10: "Core business logic must not depend directly
// on a vendor-specific payload").
export interface NormalizedCdr {
  externalCallId: string;
  domain: string;
  direction: "INBOUND" | "OUTBOUND";
  fromNumber: string;
  toNumber: string;
  startedAt: Date;
  durationSeconds: number;
}

export interface SkySwitchClient {
  fetchRecentCalls(domain: string, since: Date): Promise<NormalizedCdr[]>;
}
