import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import { CreateMailboxForm } from "@/components/admin/CreateMailboxForm";
import { SyncButton } from "@/components/admin/SyncButton";
import * as mailboxesService from "@/modules/mailboxes/service";

export default async function AdminMailboxesPage() {
  await requirePageRole(UserRole.ADMINISTRATOR);
  const mailboxes = await mailboxesService.listMailboxes();

  return (
    <div>
      <h1>Mailboxes</h1>
      <p className="page-subtitle">
        Connected business mailboxes for customer email synchronization (section 5.6). Approved
        mailboxes only — this does not sync personal mail.
      </p>

      <CreateMailboxForm />

      <SyncButton endpoint="/api/v1/integrations/microsoft/sync" label="Sync all mailboxes" />

      <table className="table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Provider</th>
            <th>Status</th>
            <th>Last synced</th>
          </tr>
        </thead>
        <tbody>
          {mailboxes.map((mailbox) => (
            <tr key={mailbox.id}>
              <td>{mailbox.emailAddress}</td>
              <td>{mailbox.provider}</td>
              <td>{mailbox.status}</td>
              <td>{mailbox.lastSyncedAt?.toISOString().slice(0, 16).replace("T", " ") ?? "Never"}</td>
            </tr>
          ))}
          {mailboxes.length === 0 && (
            <tr>
              <td colSpan={4} className="home__empty-state">
                No mailboxes connected yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
