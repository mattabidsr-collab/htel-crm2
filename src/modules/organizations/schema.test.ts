import { describe, expect, it } from "vitest";
import { OrganizationType } from "@prisma/client";

import { createOrganizationSchema, listOrganizationsQuerySchema } from "@/modules/organizations/schema";

describe("createOrganizationSchema", () => {
  it("accepts a minimal valid organization", () => {
    const result = createOrganizationSchema.parse({
      name: "Acme Health",
      types: [OrganizationType.CUSTOMER],
    });
    expect(result.name).toBe("Acme Health");
    expect(result.lifecycleStatus).toBe("PROSPECT");
  });

  it("rejects an organization with no types", () => {
    expect(() => createOrganizationSchema.parse({ name: "Acme Health", types: [] })).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() =>
      createOrganizationSchema.parse({ types: [OrganizationType.CUSTOMER] }),
    ).toThrow();
  });
});

describe("listOrganizationsQuerySchema", () => {
  it("applies default paging", () => {
    const result = listOrganizationsQuerySchema.parse({});
    expect(result.take).toBe(25);
  });

  it("coerces take to a number and enforces the max", () => {
    expect(() => listOrganizationsQuerySchema.parse({ take: "500" })).toThrow();
  });
});
