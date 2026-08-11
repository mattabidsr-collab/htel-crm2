// Pure calculation, free of Prisma so it's unit-testable without a
// database. SUP-08: open count, ticket volume by period, age of the
// oldest open ticket, recent categories, and repeat-issue indicators.

export interface TicketForMetrics {
  isOpen: boolean;
  category: string | null;
  visionCreatedAt: Date | null;
}

export function summarizeTickets(tickets: TicketForMetrics[], now: Date) {
  const openTickets = tickets.filter((t) => t.isOpen);

  const oldestOpenAgeDays =
    openTickets.length === 0
      ? null
      : Math.max(
          ...openTickets.map((t) =>
            Math.floor(
              (now.getTime() - (t.visionCreatedAt?.getTime() ?? now.getTime())) /
                (24 * 60 * 60 * 1000),
            ),
          ),
        );

  const ticketsLast90Days = tickets.filter(
    (t) =>
      t.visionCreatedAt &&
      now.getTime() - t.visionCreatedAt.getTime() <= 90 * 24 * 60 * 60 * 1000,
  ).length;

  const categoryCounts = new Map<string, number>();
  for (const ticket of tickets) {
    if (!ticket.category) continue;
    categoryCounts.set(ticket.category, (categoryCounts.get(ticket.category) ?? 0) + 1);
  }
  const repeatCategories = [...categoryCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    openCount: openTickets.length,
    totalCount: tickets.length,
    ticketsLast90Days,
    oldestOpenAgeDays,
    repeatCategories,
  };
}
