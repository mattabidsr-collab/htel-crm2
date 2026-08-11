import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompleteTaskButton } from "@/components/tasks/CompleteTaskButton";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { computeActionDeadline } from "@/modules/contracts/renewal";
import * as contractsService from "@/modules/contracts/service";
import * as tasksService from "@/modules/tasks/service";

// Home / My Work (section 8.1). Billing discrepancies join this queue as
// that module lands in a later stage.

export default async function Home() {
  const session = await auth();
  if (!session?.user) return null;

  const { overdue, upcoming } = await tasksService.getMyWorkQueue(session.user.id);

  const allContracts = await contractsService.listRenewalWorkspace();
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const urgentRenewals = allContracts
    .map((contract) => ({ contract, deadline: computeActionDeadline(contract) }))
    .filter(({ deadline }) => deadline && deadline <= in30Days);

  const openTickets = await db.visionTicketProjection.findMany({
    where: { isOpen: true },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { visionUpdatedAt: "desc" },
    take: 10,
  });

  return (
    <div className="home">
      <h1>My Work</h1>
      <p className="home__subtitle">Tasks assigned to you.</p>

      <div className="home__grid">
        <section className="home__card">
          <h2>Overdue tasks ({overdue.length})</h2>
          {overdue.length === 0 ? (
            <p className="home__empty-state">Nothing overdue.</p>
          ) : (
            <ul className="task-list">
              {overdue.map((task) => (
                <li key={task.id} className="task-row">
                  <span>
                    {task.organization && (
                      <Link href={`/organizations/${task.organization.id}`}>
                        {task.organization.name}
                      </Link>
                    )}
                    {task.organization ? " — " : ""}
                    {task.title} (due {task.dueDate?.toISOString().slice(0, 10)})
                  </span>
                  <CompleteTaskButton taskId={task.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="home__card">
          <h2>Due today &amp; next 7 days ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <p className="home__empty-state">Nothing due soon.</p>
          ) : (
            <ul className="task-list">
              {upcoming.map((task) => (
                <li key={task.id} className="task-row">
                  <span>
                    {task.organization && (
                      <Link href={`/organizations/${task.organization.id}`}>
                        {task.organization.name}
                      </Link>
                    )}
                    {task.organization ? " — " : ""}
                    {task.title} (due {task.dueDate?.toISOString().slice(0, 10)})
                  </span>
                  <CompleteTaskButton taskId={task.id} />
                </li>
              ))}
            </ul>
          )}
          <CreateTaskForm ownerId={session.user.id} />
        </section>

        <section className="home__card">
          <h2>Renewals requiring action ({urgentRenewals.length})</h2>
          {urgentRenewals.length === 0 ? (
            <p className="home__empty-state">Nothing inside its notice window.</p>
          ) : (
            <ul className="task-list">
              {urgentRenewals.map(({ contract, deadline }) => (
                <li key={contract.id} className="task-row">
                  <span>
                    <Link href={`/organizations/${contract.organizationId}/contracts`}>
                      {contract.organization.name}
                    </Link>{" "}
                    — deadline {deadline?.toISOString().slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/renewals">View all renewals →</Link>
        </section>

        <section className="home__card">
          <h2>Open Vision tickets ({openTickets.length})</h2>
          {openTickets.length === 0 ? (
            <p className="home__empty-state">Nothing open.</p>
          ) : (
            <ul className="task-list">
              {openTickets.map((ticket) => (
                <li key={ticket.id} className="task-row">
                  <span>
                    {ticket.organization && (
                      <Link href={`/organizations/${ticket.organization.id}/vision-tickets`}>
                        {ticket.organization.name}
                      </Link>
                    )}
                    {ticket.organization ? " — " : ""}
                    {ticket.subject}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="home__card">
          <h2>Billing discrepancies</h2>
          <p className="home__empty-state">Billing reconciliation lands in Stage 4.</p>
        </section>
      </div>
    </div>
  );
}
