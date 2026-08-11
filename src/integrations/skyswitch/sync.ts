import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { getSkySwitchClient } from "@/integrations/skyswitch/client";

const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

// Pulls recent CDRs for every SkySwitch platform account, matches the
// caller/callee number against our DID inventory to attribute a call to an
// organization, and creates a draft call note (needsReview=true — a human
// still fills in the substantive note, per spec 5.7.6). Idempotent via the
// externalCallId unique constraint.
export async function syncSkySwitchCallLogs(actorId: string) {
  const client = getSkySwitchClient();
  const accounts = await db.platformAccount.findMany({
    where: { provider: "SKYSWITCH", netsapiensDomain: { not: null } },
  });

  const since = new Date(Date.now() - DEFAULT_LOOKBACK_MS);
  let created = 0;
  let skippedUnmatched = 0;

  for (const account of accounts) {
    const cdrs = await client.fetchRecentCalls(account.netsapiensDomain!, since);

    for (const cdr of cdrs) {
      const existing = await db.callNote.findUnique({ where: { externalCallId: cdr.externalCallId } });
      if (existing) continue;

      const did = await db.dID.findFirst({
        where: { organizationId: account.organizationId, number: { in: [cdr.fromNumber, cdr.toNumber] } },
      });
      if (!did) {
        skippedUnmatched += 1;
        continue;
      }

      const externalNumber = did.number === cdr.fromNumber ? cdr.toNumber : cdr.fromNumber;
      const minutes = Math.floor(cdr.durationSeconds / 60);
      const seconds = cdr.durationSeconds % 60;

      const callNote = await db.callNote.create({
        data: {
          organizationId: account.organizationId,
          didId: did.id,
          occurredAt: cdr.startedAt,
          direction: cdr.direction,
          participants: [externalNumber],
          summary: `${cdr.direction === "INBOUND" ? "Inbound" : "Outbound"} call via ${did.number}, ${minutes}m ${seconds}s — needs review`,
          source: "SKYSWITCH_CDR",
          needsReview: true,
          durationSeconds: cdr.durationSeconds,
          externalCallId: cdr.externalCallId,
        },
      });
      created += 1;

      await recordAuditEvent({
        actorId,
        action: "call_note.synced_from_skyswitch",
        entityType: "CallNote",
        entityId: callNote.id,
        after: callNote,
      });
    }
  }

  return { created, skippedUnmatched, accountsChecked: accounts.length };
}
