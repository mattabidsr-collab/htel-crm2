import { db } from "@/lib/db";
import type { NormalizedCdr, SkySwitchClient } from "@/integrations/skyswitch/types";

// Generates realistic-looking CDRs against real DIDs already in a
// domain's organization, with no external dependency — exercises the
// full matching/draft-call-note pipeline without live SkySwitch access.
// Call IDs are deterministic (derived from the DID, not randomUUID) so
// repeated fetches return the same synthetic calls — a real vendor API
// would return stable IDs for historical calls, and the sync engine's
// idempotency (dedup by externalCallId) needs that to be testable at all.
export class MockSkySwitchClient implements SkySwitchClient {
  async fetchRecentCalls(domain: string, since: Date): Promise<NormalizedCdr[]> {
    const platformAccount = await db.platformAccount.findFirst({
      where: { netsapiensDomain: domain },
    });
    if (!platformAccount) return [];

    const dids = await db.dID.findMany({
      where: { organizationId: platformAccount.organizationId, status: "ACTIVE" },
      take: 3,
    });
    if (dids.length === 0) return [];

    const externalNumber = "+13135559999";

    return dids.slice(0, 2).map((did, index) => ({
      externalCallId: `mock-cdr-${did.id}`,
      domain,
      direction: index % 2 === 0 ? "INBOUND" : "OUTBOUND",
      fromNumber: index % 2 === 0 ? externalNumber : did.number,
      toNumber: index % 2 === 0 ? did.number : externalNumber,
      startedAt: new Date(Math.max(since.getTime(), Date.now() - 60 * 60 * 1000)),
      durationSeconds: 90 + index * 45,
    }));
  }
}
