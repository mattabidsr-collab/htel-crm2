// Pure matching logic, free of Prisma/network so it's unit-testable
// without a database.

const AUTOMATED_SENDER_PREFIXES = ["noreply@", "no-reply@", "donotreply@", "mailer-daemon@"];

// ACT-09: exclude internal-domain and automated-sender traffic from
// customer timelines.
export function isExcludedSender(fromAddress: string, mailboxDomain: string): boolean {
  const lower = fromAddress.toLowerCase();
  if (lower.endsWith(`@${mailboxDomain.toLowerCase()}`)) return true;
  return AUTOMATED_SENDER_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export type AssociationResult =
  | { status: "ASSOCIATED"; organizationId: string; note?: undefined }
  | { status: "AMBIGUOUS"; organizationId?: undefined; note: string }
  | { status: "PENDING"; organizationId?: undefined; note: string }
  | { status: "EXCLUDED"; organizationId?: undefined; note: string };

// ACT-07: exact known-contact match first; ambiguous or conflicting
// matches enter a review queue and are never silently guessed.
export function resolveThreadAssociation(input: {
  participantEmails: string[];
  contactOrganizations: Map<string, string[]>;
  isExcluded: boolean;
}): AssociationResult {
  if (input.isExcluded) return { status: "EXCLUDED", note: "Internal or automated sender" };

  const orgIds = new Set<string>();
  for (const email of input.participantEmails) {
    for (const orgId of input.contactOrganizations.get(email.toLowerCase()) ?? []) {
      orgIds.add(orgId);
    }
  }

  if (orgIds.size === 0) return { status: "PENDING", note: "No known contact matched" };
  if (orgIds.size > 1) {
    return { status: "AMBIGUOUS", note: `${orgIds.size} organizations matched via different contacts` };
  }
  return { status: "ASSOCIATED", organizationId: [...orgIds][0] };
}
