import Link from "next/link";

import { auth } from "@/lib/auth";
import { CompleteTaskButton } from "@/components/tasks/CompleteTaskButton";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import * as sitesService from "@/modules/sites/service";
import * as contactsService from "@/modules/contacts/service";
import { db } from "@/lib/db";

export default async function OrganizationOverviewPage(
  props: PageProps<"/organizations/[id]">,
) {
  const { id } = await props.params;
  const session = await auth();

  const [sites, contacts, openTasks] = await Promise.all([
    sitesService.listSites({ organizationId: id, take: 5 }),
    contactsService.listContacts({ organizationId: id, take: 5 }),
    db.task.findMany({
      where: { organizationId: id, status: { in: ["OPEN", "IN_PROGRESS"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
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
        <h2>Active services</h2>
        <p className="home__empty-state">Telecom inventory lands in Stage 2.</p>
      </section>

      <section className="home__card">
        <h2>Open Vision tickets</h2>
        <p className="home__empty-state">Vision integration lands in Stage 3.</p>
      </section>

      <section className="home__card">
        <h2>Contracts</h2>
        <p className="home__empty-state">Contracts &amp; renewals land in Stage 2.</p>
      </section>
    </div>
  );
}
