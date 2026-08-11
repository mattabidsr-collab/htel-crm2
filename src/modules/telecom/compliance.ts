import { db } from "@/lib/db";

export interface ComplianceException {
  type: "sms_without_approved_campaign" | "active_did_e911_pending";
  didId: string;
  number: string;
  detail: string;
}

// TEL-09: invalid operational states generate exceptions — active SMS
// without an approved 10DLC campaign, and an active DID whose E911
// disposition is still pending.
export async function getComplianceExceptions(
  organizationId: string,
): Promise<ComplianceException[]> {
  const dids = await db.dID.findMany({
    where: { organizationId },
    include: { tenDlcCampaign: true },
  });

  const exceptions: ComplianceException[] = [];

  for (const did of dids) {
    if (did.smsStatus === "APPROVED" && did.tenDlcCampaign?.status !== "APPROVED") {
      exceptions.push({
        type: "sms_without_approved_campaign",
        didId: did.id,
        number: did.number,
        detail: did.tenDlcCampaign
          ? `Linked 10DLC campaign is ${did.tenDlcCampaign.status}, not APPROVED`
          : "No 10DLC campaign linked",
      });
    }

    if (did.status === "ACTIVE" && did.e911Status === "PENDING") {
      exceptions.push({
        type: "active_did_e911_pending",
        didId: did.id,
        number: did.number,
        detail: "E911 dispatchable location not yet verified or excepted",
      });
    }
  }

  return exceptions;
}
