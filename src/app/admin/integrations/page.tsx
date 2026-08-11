import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import { SyncButton } from "@/components/admin/SyncButton";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export default async function AdminIntegrationsPage() {
  await requirePageRole(UserRole.ADMINISTRATOR);

  const connectUcConfigured = Boolean(env.CONNECTUC_WEBHOOK_SECRET);
  const [connectUcCount, lastConnectUcNote] = await Promise.all([
    db.callNote.count({ where: { source: "CONNECTUC" } }),
    db.callNote.findFirst({ where: { source: "CONNECTUC" }, orderBy: { createdAt: "desc" } }),
  ]);
  const microsoftConfigured = Boolean(
    env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_TENANT_ID,
  );
  const visionConfigured = Boolean(
    env.VISION_API_BASE_URL &&
      (env.VISION_API_TOKEN || (env.VISION_API_USERNAME && env.VISION_API_PASSWORD)),
  );

  return (
    <div>
      <h1>Integrations</h1>
      <p className="page-subtitle">
        No cron infrastructure is wired up yet, so polling syncs run on demand from here.
        ConnectUC is push-based (webhooks via Activepieces) and needs no manual sync.
      </p>

      <section className="home__card">
        <h2>ConnectUC call logs &amp; transcripts</h2>
        <p>
          Status:{" "}
          {connectUcConfigured ? (
            <span className="badge">Webhook secret configured</span>
          ) : (
            <span className="badge badge-warn">
              CONNECTUC_WEBHOOK_SECRET is unset — all webhook calls are rejected
            </span>
          )}
        </p>
        <p className="page-subtitle">
          An Activepieces flow holds the ConnectUC connection and POSTs &ldquo;New CDR&rdquo; and
          &ldquo;New Call Transcription&rdquo; events to the webhook endpoints below. CDR events
          match caller/callee numbers against the DID inventory and create draft call notes
          flagged &ldquo;needs review&rdquo;; transcription events attach transcript text to the
          matching call note once one exists.
        </p>
        <ul>
          <li>
            <code>POST /api/v1/integrations/connectuc/cdr</code>
          </li>
          <li>
            <code>POST /api/v1/integrations/connectuc/transcription</code>
          </li>
        </ul>
        <p className="page-subtitle">
          Both require <code>Authorization: Bearer &lt;CONNECTUC_WEBHOOK_SECRET&gt;</code>.{" "}
          {connectUcCount} call note{connectUcCount === 1 ? "" : "s"} synced from ConnectUC so far
          {lastConnectUcNote && `, most recently ${lastConnectUcNote.createdAt.toISOString().slice(0, 16).replace("T", " ")}`}
          .
        </p>
      </section>

      <section className="home__card">
        <h2>Mailboxes (Outlook)</h2>
        <p>
          Status:{" "}
          {microsoftConfigured ? (
            <span className="badge">Live credentials configured</span>
          ) : (
            <span className="badge badge-warn">
              Using mock client — set MICROSOFT_* env vars for live data
            </span>
          )}
        </p>
        <p className="page-subtitle">
          Manage connected mailboxes and run syncs from the <a href="/admin/mailboxes">Mailboxes</a>{" "}
          page.
        </p>
      </section>

      <section className="home__card">
        <h2>Vision Helpdesk tickets</h2>
        <p>
          Status:{" "}
          {visionConfigured ? (
            <span className="badge">Live credentials configured</span>
          ) : (
            <span className="badge badge-warn">Using mock client — set VISION_* env vars for live data</span>
          )}
        </p>
        <p className="page-subtitle">
          Read-only ticket sync (SUP-01/SUP-05). Unmapped Vision customer identities go to the{" "}
          <a href="/admin/vision-review">Vision Review</a> queue.
        </p>
        <SyncButton endpoint="/api/v1/integrations/vision/sync" label="Sync Vision tickets" />
      </section>
    </div>
  );
}
