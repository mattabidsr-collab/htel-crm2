import { describe, expect, it } from "vitest";

import { createSiteSchema } from "@/modules/sites/schema";

describe("createSiteSchema", () => {
  const organizationId = "11111111-1111-4111-8111-111111111111";

  it("applies default status and timezone", () => {
    const result = createSiteSchema.parse({ organizationId, name: "Main Office" });
    expect(result.status).toBe("PENDING");
    expect(result.timezone).toBe("America/Detroit");
  });

  it("rejects a missing name", () => {
    expect(() => createSiteSchema.parse({ organizationId })).toThrow();
  });

  it("rejects an invalid organizationId", () => {
    expect(() => createSiteSchema.parse({ organizationId: "not-a-uuid", name: "X" })).toThrow();
  });
});
