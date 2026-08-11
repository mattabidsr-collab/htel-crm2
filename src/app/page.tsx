import Link from "next/link";

import { auth } from "@/lib/auth";
import { CompleteTaskButton } from "@/components/tasks/CompleteTaskButton";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import * as tasksService from "@/modules/tasks/service";

// Home / My Work (section 8.1). Renewals, Vision tickets, and billing
// discrepancies join this queue as those modules land in later stages.

export default async function Home() {
  const session = await auth();
  if (!session?.user) return null;

  const { overdue, upcoming } = await tasksService.getMyWorkQueue(session.user.id);

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
          <h2>Renewals requiring action</h2>
          <p className="home__empty-state">Contracts &amp; renewals land in Stage 2.</p>
        </section>

        <section className="home__card">
          <h2>Open Vision tickets</h2>
          <p className="home__empty-state">Vision integration lands in Stage 3.</p>
        </section>

        <section className="home__card">
          <h2>Billing discrepancies</h2>
          <p className="home__empty-state">Billing reconciliation lands in Stage 4.</p>
        </section>
      </div>
    </div>
  );
}
