import Link from "next/link";

import { auth } from "@/lib/auth";
import { CompleteTaskButton } from "@/components/tasks/CompleteTaskButton";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import * as sitesService from "@/modules/sites/service";
import * as contactsService from "@/modules/contacts/service";
import * as servicesService from "@/modules/services/service";
import * as contractsService from "@/modules/contracts/service";
import { db } from "@/lib/db";

export default async function OrganizationOverviewPage(
  props: PageProps<"/organizations/[id]">,
) {
  const { id } = await props.params;
  const session = await auth();

  const [sites, contacts, openTasks, services, contracts, openTickets] = await Promise.all([
    sitesService.listSites({ organizationId: id, take: 5 }),
    contactsService.listContacts({ organizationId: id, take: 5 }),
    db.task.findMany({
      where: { organizationId: id, status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    servicesService.listServices({ organizationId: id }),
    contractsService.listContracts({ organizationId: id }),
    db.visionTicketProjection.findMany({
      where: { organizationId: id, isOpen: true },
      orderBy: { visionUpdatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="org-overview">
      <section className="home__card">
        <h2>Next actions</h2>
        {openTasks.length === 0 ? (
          <p className="home__empty-state">No open tasks for this account.</p>
        ) : (
          <ul className="task-list">
            {openTasks.map((task) => (
              <li key={task.id} className="task-row">
                <span>
                  {task.title}
                  {task.dueDate ? ` — due ${task.dueDate.toISOString().slice(0, 10)}` : ""}
                </span>
                <CompleteTaskButton taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        {session?.user && <CreateTaskForm organizationId={id} ownerId={session.user.id} />}
      </section>

      <section className="home__card">
        <h2>Sites ({sites.length})</h2>
        {sites.length === 0 ? (
          <p className="home__empty-state">No sites yet.</p>
        ) : (
          <ul>
            {sites.map((site) => (
              <li key={site.id}>{site.name}</li>
            ))}
          </ul>
        )}
        <Link href={`/organizations/${id}/sites`}>View all sites →</Link>
      </section>

      <section className="home__card">
        <h2>Key contacts ({contacts.length})</h2>
        {contacts.length === 0 ? (
          <p className="home__empty-state">No contacts yet.</p>
        ) : (
          <ul>
            {contacts.map((contact) => (
              <li key={contact.id}>
                {contact.firstName} {contact.lastName}
              </li>
            ))}
          </ul>
        )}
        <Link href={`/organizations/${id}/contacts`}>View all contacts →</Link>
      </section>

      <section className="home__card">
        <h2>Active services ({services.length})</h2>
        {services.length === 0 ? (
          <p className="home__empty-state">No services yet.</p>
        ) : (
          <ul>
            {services.slice(0, 5).map((service) => (
              <li key={service.id}>
                {service.type} × {service.quantity} ({service.status})
              </li>
            ))}
          </ul>
        )}
        <Link href={`/organizations/${id}/telecom`}>View telecom →</Link>
      </section>

      <section className="home__card">
        <h2>Open Vision tickets ({openTickets.length})</h2>
        {openTickets.length === 0 ? (
          <p className="home__empty-state">No open tickets.</p>
        ) : (
          <ul>
            {openTickets.map((ticket) => (
              <li key={ticket.id}>{ticket.subject}</li>
            ))}
          </ul>
        )}
        <Link href={`/organizations/${id}/vision-tickets`}>View all tickets →</Link>
      </section>

      <section className="home__card">
        <h2>Contracts ({contracts.length})</h2>
        {contracts.length === 0 ? (
          <p className="home__empty-state">No contracts yet.</p>
        ) : (
          <ul>
            {contracts.slice(0, 5).map((contract) => (
              <li key={contract.id}>
                {contract.type} — {contract.status}
              </li>
            ))}
          </ul>
        )}
        <Link href={`/organizations/${id}/contracts`}>View contracts →</Link>
      </section>
    </div>
  );
}
