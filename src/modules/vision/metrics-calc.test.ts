import { describe, expect, it } from "vitest";

import { summarizeTickets, type TicketForMetrics } from "@/modules/vision/metrics-calc";

const now = new Date("2026-08-11T00:00:00.000Z");

function ticket(overrides: Partial<TicketForMetrics>): TicketForMetrics {
  return { isOpen: true, category: null, visionCreatedAt: now, ...overrides };
}

describe("summarizeTickets", () => {
  it("counts open vs total tickets", () => {
    const result = summarizeTickets(
      [ticket({ isOpen: true }), ticket({ isOpen: true }), ticket({ isOpen: false })],
      now,
    );
    expect(result.openCount).toBe(2);
    expect(result.totalCount).toBe(3);
  });

  it("computes the age in days of the oldest open ticket", () => {
    const result = summarizeTickets(
      [
        ticket({ isOpen: true, visionCreatedAt: new Date("2026-08-01T00:00:00.000Z") }), // 10 days
        ticket({ isOpen: true, visionCreatedAt: new Date("2026-08-09T00:00:00.000Z") }), // 2 days
        ticket({ isOpen: false, visionCreatedAt: new Date("2026-01-01T00:00:00.000Z") }), // closed, excluded
      ],
      now,
    );
    expect(result.oldestOpenAgeDays).toBe(10);
  });

  it("returns null oldest-open-age when nothing is open", () => {
    const result = summarizeTickets([ticket({ isOpen: false })], now);
    expect(result.oldestOpenAgeDays).toBeNull();
  });

  it("counts tickets created within the last 90 days", () => {
    const result = summarizeTickets(
      [
        ticket({ visionCreatedAt: new Date("2026-08-01T00:00:00.000Z") }), // within 90 days
        ticket({ visionCreatedAt: new Date("2026-01-01T00:00:00.000Z") }), // outside 90 days
      ],
      now,
    );
    expect(result.ticketsLast90Days).toBe(1);
  });

  it("flags categories with more than one ticket as repeat issues, sorted by count", () => {
    const result = summarizeTickets(
      [
        ticket({ category: "Billing" }),
        ticket({ category: "Billing" }),
        ticket({ category: "Billing" }),
        ticket({ category: "Technical" }),
        ticket({ category: "Technical" }),
        ticket({ category: "Provisioning" }),
      ],
      now,
    );
    expect(result.repeatCategories).toEqual([
      { category: "Billing", count: 3 },
      { category: "Technical", count: 2 },
    ]);
  });
});
