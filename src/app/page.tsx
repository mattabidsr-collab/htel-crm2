// Home / My Work (section 8.1). Data wiring lands in Stage 1 (Foundation);
// this scaffold establishes the layout the real widgets will fill in.

const workQueueSections = [
  { title: "Overdue tasks", description: "CRM tasks and integration exceptions past their due date." },
  { title: "Due today & next 7 days", description: "Upcoming tasks and renewal actions." },
  { title: "Renewals requiring action", description: "Contracts inside their notice window." },
  { title: "Open Vision tickets", description: "Aging or high-priority tickets needing account-level attention." },
  { title: "Billing discrepancies", description: "Reconciliation exceptions assigned to you." },
];

export default function Home() {
  return (
    <div className="home">
      <h1>My Work</h1>
      <p className="home__subtitle">
        Heritage CRM is scaffolded and ready for Stage 1 (Foundation) development.
      </p>
      <div className="home__grid">
        {workQueueSections.map((section) => (
          <section key={section.title} className="home__card">
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <p className="home__empty-state">Nothing to show yet.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
