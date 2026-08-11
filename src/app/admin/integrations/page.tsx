import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import { SyncButton } from "@/components/admin/SyncButton";
import { env } from "@/lib/env";

export default async function AdminIntegrationsPage() {
  await requirePageRole(UserRole.ADMINISTRATOR);

  const skySwitchConfigured = Boolean(
    env.SKYSWITCH_CLIENT_ID && env.SKYSWITCH_CLIENT_SECRET && env.SKYSWITCH_API_BASE_URL,
  );
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
        No cron infrastructure is wired up yet, so syncs run on demand from here.
      </p>

      <section className="home__card">
        <h2>SkySwitch call logs</h2>
        <p>
          Status:{" "}
          {skySwitchConfigured ? (
            <span className="badge">Live credentials configured</span>
          ) : (
            <span className="badge badge-warn">Using mock client — set SKYSWITCH_* env vars for live data</span>
          )}
        </p>
        <p className="page-subtitle">
          Pulls recent CDRs, matches numbers against the DID inventory, and creates draft call
          notes flagged &ldquo;needs review.&rdquo;
        </p>
        <SyncButton endpoint="/api/v1/integrations/skyswitch/sync" label="Sync call logs" />
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
