import { describe, expect, it } from "vitest";

import { computeActionDeadline, RENEWAL_ALERT_INTERVAL_DAYS } from "@/modules/contracts/renewal";

describe("computeActionDeadline", () => {
  it("subtracts notice days from the end date", () => {
    const deadline = computeActionDeadline({
      endDate: new Date("2027-01-01T00:00:00.000Z"),
      noticeDays: 60,
    });
    expect(deadline?.toISOString().slice(0, 10)).toBe("2026-11-02");
  });

  it("returns null when there is no end date", () => {
    expect(computeActionDeadline({ endDate: null, noticeDays: 60 })).toBeNull();
  });

  it("handles zero notice days", () => {
    const endDate = new Date("2027-01-01T00:00:00.000Z");
    const deadline = computeActionDeadline({ endDate, noticeDays: 0 });
    expect(deadline?.getTime()).toBe(endDate.getTime());
  });
});

describe("RENEWAL_ALERT_INTERVAL_DAYS", () => {
  it("matches the spec's configured intervals", () => {
    expect(RENEWAL_ALERT_INTERVAL_DAYS).toEqual([180, 120, 90, 60, 30]);
  });
});
