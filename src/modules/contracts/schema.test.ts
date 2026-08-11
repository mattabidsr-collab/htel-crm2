import { describe, expect, it } from "vitest";

import { createContractSchema, updateContractSchema } from "@/modules/contracts/schema";

const organizationId = "11111111-1111-4111-8111-111111111111";

describe("createContractSchema", () => {
  it("applies defaults", () => {
    const result = createContractSchema.parse({ organizationId });
    expect(result.type).toBe("MSA");
    expect(result.noticeDays).toBe(60);
    expect(result.autoRenew).toBe(false);
  });
});

describe("updateContractSchema", () => {
  it("requires a new end date and term when marking a contract renewed (business rule 6)", () => {
    expect(() =>
      updateContractSchema.parse({ renewalDisposition: "RENEWED" }),
    ).toThrow();
  });

  it("accepts RENEWED when a new end date and term are supplied", () => {
    const result = updateContractSchema.parse({
      renewalDisposition: "RENEWED",
      endDate: "2027-01-01",
      termMonths: 12,
    });
    expect(result.renewalDisposition).toBe("RENEWED");
  });

  it("allows non-RENEWED dispositions without new dates", () => {
    const result = updateContractSchema.parse({ renewalDisposition: "CHURNED" });
    expect(result.renewalDisposition).toBe("CHURNED");
  });
});
