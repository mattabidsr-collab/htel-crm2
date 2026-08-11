import { describe, expect, it } from "vitest";

import { isExcludedSender, resolveThreadAssociation } from "@/modules/email/matching";

describe("isExcludedSender", () => {
  it("excludes senders on the mailbox's own domain", () => {
    expect(isExcludedSender("teammate@heritagetel.com", "heritagetel.com")).toBe(true);
  });

  it("excludes common automated-sender prefixes", () => {
    expect(isExcludedSender("noreply@vendor.example", "heritagetel.com")).toBe(true);
    expect(isExcludedSender("no-reply@vendor.example", "heritagetel.com")).toBe(true);
  });

  it("does not exclude a normal external customer address", () => {
    expect(isExcludedSender("jane@customer.example", "heritagetel.com")).toBe(false);
  });
});

describe("resolveThreadAssociation", () => {
  const org1 = "11111111-1111-4111-8111-111111111111";
  const org2 = "22222222-2222-4222-8222-222222222222";

  it("returns EXCLUDED when the sender is excluded, before matching contacts", () => {
    const result = resolveThreadAssociation({
      participantEmails: ["jane@customer.example"],
      contactOrganizations: new Map([["jane@customer.example", [org1]]]),
      isExcluded: true,
    });
    expect(result.status).toBe("EXCLUDED");
  });

  it("returns PENDING when no participant matches a known contact", () => {
    const result = resolveThreadAssociation({
      participantEmails: ["stranger@example.com"],
      contactOrganizations: new Map(),
      isExcluded: false,
    });
    expect(result.status).toBe("PENDING");
  });

  it("returns ASSOCIATED with the single matched organization", () => {
    const result = resolveThreadAssociation({
      participantEmails: ["jane@customer.example"],
      contactOrganizations: new Map([["jane@customer.example", [org1]]]),
      isExcluded: false,
    });
    expect(result).toEqual({ status: "ASSOCIATED", organizationId: org1 });
  });

  it("returns AMBIGUOUS when participants imply conflicting organizations, never guessing", () => {
    const result = resolveThreadAssociation({
      participantEmails: ["jane@customer.example", "bob@other.example"],
      contactOrganizations: new Map([
        ["jane@customer.example", [org1]],
        ["bob@other.example", [org2]],
      ]),
      isExcluded: false,
    });
    expect(result.status).toBe("AMBIGUOUS");
  });

  it("matches case-insensitively", () => {
    const result = resolveThreadAssociation({
      participantEmails: ["Jane@Customer.EXAMPLE"],
      contactOrganizations: new Map([["jane@customer.example", [org1]]]),
      isExcluded: false,
    });
    expect(result).toEqual({ status: "ASSOCIATED", organizationId: org1 });
  });
});
