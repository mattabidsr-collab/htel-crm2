import { UserRole } from "@prisma/client";

import { requirePageRole } from "@/lib/require-page-role";
import * as auditRepo from "@/modules/audit/repository";

export default async function AuditLogPage(props: PageProps<"/admin/audit-log">) {
  await requirePageRole(UserRole.ADMINISTRATOR);
  const searchParams = await props.searchParams;

  const entityType = typeof searchParams.entityType === "string" ? searchParams.entityType : "";
  const actorId = typeof searchParams.actorId === "string" ? searchParams.actorId : "";
  const from = typeof searchParams.from === "string" ? searchParams.from : "";
  const to = typeof searchParams.to === "string" ? searchParams.to : "";

  const [events, entityTypes, actors] = await Promise.all([
    auditRepo.listAuditEvents({
      entityType: entityType || undefined,
      actorId: actorId || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      take: 200,
    }),
    auditRepo.listDistinctEntityTypes(),
    auditRepo.listActorsForFilter(),
  ]);

  return (
    <div>
      <h1>Audit Log</h1>
      <p className="page-subtitle">
        Every create, update, delete, import, export, login, and permission change, by actor and
        timestamp (ADM-03). Showing the most recent 200 matching events.
      </p>

      <form className="audit-filters" method="get">
        <label className="form-field">
          Entity type
          <select name="entityType" defaultValue={entityType}>
            <option value="">All</option>
            {entityTypes.map((e) => (
              <option key={e.entityType} value={e.entityType}>
                {e.entityType}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Actor
          <select name="actorId" defaultValue={actorId}>
            <option value="">All</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          From
          <input type="date" name="from" defaultValue={from} />
        </label>
        <label className="form-field">
          To
          <input type="date" name="to" defaultValue={to} />
        </label>
        <button className="btn btn-primary" type="submit">
          Filter
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.occurredAt.toISOString()}</td>
              <td>{event.actor ? `${event.actor.name} (${event.actor.email})` : "System"}</td>
              <td>{event.action}</td>
              <td>
                {event.entityType}
                {event.entityId ? ` #${event.entityId.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={4} className="home__empty-state">
                No matching audit events.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
