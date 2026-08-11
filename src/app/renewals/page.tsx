import Link from "next/link";

import { computeActionDeadline } from "@/modules/contracts/renewal";
import * as contractsService from "@/modules/contracts/service";
import { calcMrr } from "@/modules/telecom/metrics";

const BUCKETS = [
  { label: "Overdue", max: 0 },
  { label: "Next 30 days", max: 30 },
  { label: "31–60 days", max: 60 },
  { label: "61–90 days", max: 90 },
  { label: "91–120 days", max: 120 },
  { label: "121–180 days", max: 180 },
  { label: "180+ days", max: Infinity },
];

function bucketFor(daysUntilDeadline: number) {
  for (const bucket of BUCKETS) {
    if (daysUntilDeadline <= bucket.max) return bucket.label;
  }
  return BUCKETS[BUCKETS.length - 1].label;
}

export default async function RenewalsPage() {
  const contracts = await contractsService.listRenewalWorkspace();
  const now = new Date();

  const rows = await Promise.all(
    contracts.map(async (contract) => {
      const deadline = computeActionDeadline(contract);
      const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : Infinity;
      const { mrr } = await calcMrr(contract.organizationId);
      return { contract, deadline, daysUntilDeadline, mrr };
    }),
  );

  const grouped = new Map<string, typeof rows>();
  for (const bucket of BUCKETS) grouped.set(bucket.label, []);
  for (const row of rows) {
    const label = bucketFor(row.daysUntilDeadline);
    grouped.get(label)!.push(row);
  }

  return (
    <div>
      <h1>Renewals</h1>
      <p className="page-subtitle">
        Bucketed by action deadline (end date minus required notice days), not merely contract
        end date.
      </p>

      {BUCKETS.map((bucket) => {
        const bucketRows = grouped.get(bucket.label) ?? [];
        if (bucketRows.length === 0) return null;
        return (
          <section key={bucket.label} className="home__card">
            <h2>
              {bucket.label} ({bucketRows.length})
            </h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Type</th>
                  <th>Action deadline</th>
                  <th>End date</th>
                  <th>MRR</th>
                  <th>Auto-renew</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {bucketRows.map(({ contract, deadline, mrr }) => (
                  <tr key={contract.id}>
                    <td>
                      <Link href={`/organizations/${contract.organizationId}/contracts`}>
                        {contract.organization.name}
                      </Link>
                    </td>
                    <td>{contract.type}</td>
                    <td>{deadline?.toISOString().slice(0, 10) ?? "—"}</td>
                    <td>{contract.endDate?.toISOString().slice(0, 10) ?? "—"}</td>
                    <td>${mrr.toFixed(2)}</td>
                    <td>{contract.autoRenew ? "Yes" : "No"}</td>
                    <td>{contract.owner?.name ?? "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      {rows.length === 0 && <p className="home__empty-state">No active contracts with an end date.</p>}
    </div>
  );
}
