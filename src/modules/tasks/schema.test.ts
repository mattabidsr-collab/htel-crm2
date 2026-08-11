import { describe, expect, it } from "vitest";

import { createTaskSchema, updateTaskSchema } from "@/modules/tasks/schema";

describe("createTaskSchema", () => {
  const ownerId = "11111111-1111-4111-8111-111111111111";

  it("applies default priority", () => {
    const result = createTaskSchema.parse({ title: "Follow up", ownerId });
    expect(result.priority).toBe("NORMAL");
  });

  it("rejects a missing owner", () => {
    expect(() => createTaskSchema.parse({ title: "Follow up" })).toThrow();
  });

  it("coerces a date string for dueDate", () => {
    const result = createTaskSchema.parse({ title: "Follow up", ownerId, dueDate: "2026-09-01" });
    expect(result.dueDate).toBeInstanceOf(Date);
  });
});

describe("updateTaskSchema", () => {
  it("rejects an invalid status", () => {
    expect(() => updateTaskSchema.parse({ status: "NOT_A_STATUS" })).toThrow();
  });
});
