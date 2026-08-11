import { describe, expect, it } from "vitest";

import { sanitizeEmailHtml } from "@/integrations/email/sanitize";

describe("sanitizeEmailHtml", () => {
  it("strips script tags", () => {
    const result = sanitizeEmailHtml("<p>Hello</p><script>alert('x')</script>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert(");
    expect(result).toContain("Hello");
  });

  it("strips 1x1 tracking pixels", () => {
    const result = sanitizeEmailHtml('<p>Body</p><img src="https://t.example.com/p.gif" width="1" height="1" />');
    expect(result).not.toContain("t.example.com");
  });

  it("keeps normal images", () => {
    const result = sanitizeEmailHtml('<img src="https://example.com/logo.png" width="200" height="80" />');
    expect(result).toContain("example.com/logo.png");
  });

  it("strips inline event handlers", () => {
    const result = sanitizeEmailHtml('<p onclick="steal()">Click me</p>');
    expect(result).not.toContain("onclick");
  });

  it("strips iframes", () => {
    const result = sanitizeEmailHtml('<iframe src="https://evil.example.com"></iframe><p>Text</p>');
    expect(result).not.toContain("<iframe");
    expect(result).toContain("Text");
  });

  it("preserves readable plain-text content", () => {
    const result = sanitizeEmailHtml("<p>Following up on our service call.</p>");
    expect(result).toContain("Following up on our service call.");
  });
});
