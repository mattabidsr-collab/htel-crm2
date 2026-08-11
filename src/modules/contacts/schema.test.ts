import { describe, expect, it } from "vitest";

import { createContactSchema } from "@/modules/contacts/schema";

describe("createContactSchema", () => {
  const organizationId = "11111111-1111-4111-8111-111111111111";

  it("accepts a minimal valid contact", () => {
    const result = createContactSchema.parse({
      firstName: "Jane",
      lastName: "Doe",
      organizationId,
      role: "TECHNICAL",
    });
    expect(result.emails).toEqual([]);
    expect(result.isPrimary).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(() =>
      createContactSchema.parse({
        firstName: "Jane",
        lastName: "Doe",
        organizationId,
        role: "TECHNICAL",
        emails: ["not-an-email"],
      }),
    ).toThrow();
  });

  it("rejects a missing organizationId", () => {
    expect(() =>
      createContactSchema.parse({ firstName: "Jane", lastName: "Doe", role: "TECHNICAL" }),
    ).toThrow();
  });
});
