import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import { VisionIdentityReviewActions } from "@/components/admin/VisionIdentityReviewActions";
import * as mappingService from "@/modules/vision/mapping";
import * as organizationsService from "@/modules/organizations/service";

export default async function VisionReviewQueuePage() {
  await requirePageRole(UserRole.ADMINISTRATOR);

  const [mappings, organizations] = await Promise.all([
    mappingService.listUnmappedIdentities(),
    organizationsService.listOrganizations({ take: 200 }),
  ]);

  const orgOptions = organizations.map((org) => ({ id: org.id, name: org.name }));

  return (
    <div>
      <h1>Vision integration review</h1>
      <p className="page-subtitle">
        Unmapped Vision customer identities (SUP-06/SUP-07) — tickets stay unattributed to any
        account until mapped here. Mapping backfills any tickets already synced for this
        identity.
      </p>

      <table className="table">
        <thead>
          <tr>
            <th>Vision customer</th>
            <th>External ID</th>
            <th>Last seen</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.id}>
              <td>{mapping.externalCustomerName ?? "(unnamed)"}</td>
              <td>{mapping.externalCustomerId}</td>
              <td>{mapping.lastSeenAt.toISOString().slice(0, 16).replace("T", " ")}</td>
              <td>
                <VisionIdentityReviewActions mappingId={mapping.id} organizations={orgOptions} />
              </td>
            </tr>
          ))}
          {mappings.length === 0 && (
            <tr>
              <td colSpan={4} className="home__empty-state">
                Nothing waiting for review.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
