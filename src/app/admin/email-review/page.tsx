import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import { EmailThreadReviewActions } from "@/components/admin/EmailThreadReviewActions";
import * as reviewService from "@/modules/email/review";
import * as organizationsService from "@/modules/organizations/service";

export default async function EmailReviewQueuePage() {
  await requirePageRole(UserRole.ADMINISTRATOR);

  const [threads, organizations] = await Promise.all([
    reviewService.listReviewQueue(),
    organizationsService.listOrganizations({ take: 200 }),
  ]);

  const orgOptions = organizations.map((org) => ({ id: org.id, name: org.name }));

  return (
    <div>
      <h1>Email association review</h1>
      <p className="page-subtitle">
        Ambiguous or unmatched senders never get silently guessed onto an account (ACT-07) — they
        wait here for a manual decision (ACT-10).
      </p>

      <table className="table">
        <thead>
          <tr>
            <th>Mailbox</th>
            <th>Subject</th>
            <th>From</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((thread) => (
            <tr key={thread.id}>
              <td>{thread.mailbox.emailAddress}</td>
              <td>{thread.subject ?? "(no subject)"}</td>
              <td>{thread.messages[0]?.fromAddress ?? "—"}</td>
              <td>{thread.associationStatus}</td>
              <td>{thread.associationNote ?? "—"}</td>
              <td>
                <EmailThreadReviewActions threadId={thread.id} organizations={orgOptions} />
              </td>
            </tr>
          ))}
          {threads.length === 0 && (
            <tr>
              <td colSpan={6} className="home__empty-state">
                Nothing waiting for review.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
