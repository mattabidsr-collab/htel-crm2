import { describe, expect, it } from "vitest";

import { summarizeServiceLines, type ServiceLine } from "@/modules/telecom/calc";

const baseLine: ServiceLine = {
  status: "ACTIVE",
  activationDate: null,
  terminationDate: null,
  quantity: 1,
  unitPrice: 10,
  unitCost: 4,
};

describe("summarizeServiceLines", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");

  it("sums active lines by quantity", () => {
    const result = summarizeServiceLines(
      [
        { ...baseLine, quantity: 3, unitPrice: 20, unitCost: 8 },
        { ...baseLine, quantity: 1, unitPrice: 5, unitCost: 2 },
      ],
      now,
    );
    expect(result.mrr).toBe(65);
    expect(result.estimatedCost).toBe(26);
    expect(result.estimatedMargin).toBe(39);
    expect(result.activeServiceCount).toBe(2);
  });

  it("excludes non-active lines", () => {
    const result = summarizeServiceLines(
      [
        { ...baseLine, status: "PENDING" },
        { ...baseLine, status: "TERMINATED" },
      ],
      now,
    );
    expect(result.mrr).toBe(0);
    expect(result.activeServiceCount).toBe(0);
  });

  it("excludes lines not yet activated or already terminated at the effective date", () => {
    const result = summarizeServiceLines(
      [
        { ...baseLine, activationDate: new Date("2026-07-01T00:00:00.000Z") }, // future
        { ...baseLine, terminationDate: new Date("2026-06-01T00:00:00.000Z") }, // past
        { ...baseLine, terminationDate: new Date("2026-07-01T00:00:00.000Z") }, // still active
      ],
      now,
    );
    expect(result.activeServiceCount).toBe(1);
  });

  it("marks estimated cost Incomplete (null) when any active line lacks a unit cost", () => {
    const result = summarizeServiceLines(
      [
        { ...baseLine, unitCost: 4 },
        { ...baseLine, unitCost: null },
      ],
      now,
    );
    expect(result.mrr).toBe(20);
    expect(result.estimatedCost).toBeNull();
    expect(result.estimatedMargin).toBeNull();
  });
});
