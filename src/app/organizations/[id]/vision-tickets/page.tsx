import { db } from "@/lib/db";
import { getSupportMetrics } from "@/modules/vision/metrics";

export default async function OrganizationVisionTicketsPage(
  props: PageProps<"/organizations/[id]/vision-tickets">,
) {
  const { id } = await props.params;

  const [tickets, metrics] = await Promise.all([
    db.visionTicketProjection.findMany({
      where: { organizationId: id },
      orderBy: { visionUpdatedAt: "desc" },
    }),
    getSupportMetrics(id),
  ]);

  return (
    <div>
      <p className="page-subtitle">
        Vision remains authoritative for ticket status, assignment, SLA, and replies (business
        rule 8) — this is a read-only projection for account context. Open the source ticket in
        Vision to reply or change status.
      </p>

      <section className="home__card">
        <h2>Support summary</h2>
        <dl className="org-header__stats">
          <div>
            <dt>Open tickets</dt>
            <dd>{metrics.openCount}</dd>
          </div>
          <div>
            <dt>Last 90 days</dt>
            <dd>{metrics.ticketsLast90Days}</dd>
          </div>
          <div>
            <dt>Oldest open ticket</dt>
            <dd>{metrics.oldestOpenAgeDays === null ? "—" : `${metrics.oldestOpenAgeDays}d`}</dd>
          </div>
          <div>
            <dt>Repeat categories</dt>
            <dd>
              {metrics.repeatCategories.length === 0
                ? "None"
                : metrics.repeatCategories.map((c) => `${c.category} (${c.count})`).join(", ")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="home__card">
        <h2>Tickets ({tickets.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Technician</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.subject}</td>
                <td>
                  {ticket.status}
                  {ticket.isOpen && <span className="badge badge-warn"> Open</span>}
                </td>
                <td>{ticket.priority ?? "—"}</td>
                <td>{ticket.category ?? "—"}</td>
                <td>{ticket.technician ?? "—"}</td>
                <td>{ticket.visionUpdatedAt?.toISOString().slice(0, 10) ?? "—"}</td>
                <td>
                  <a href={ticket.externalUrl} target="_blank" rel="noopener noreferrer" className="btn">
                    Open in Vision
                  </a>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={7} className="home__empty-state">
                  No linked Vision tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
