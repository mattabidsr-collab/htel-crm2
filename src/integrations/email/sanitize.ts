import sanitizeHtml from "sanitize-html";

// ACT-14: display the complete synchronized customer-email body while
// stripping scripts, tracking pixels, and other unsafe active content.
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "u", "font"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["style", "align"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Strip remote-loaded 1x1 tracking pixels (any image only a few
    // pixels in either dimension).
    exclusiveFilter: (frame) => {
      if (frame.tag !== "img") return false;
      const width = Number(frame.attribs.width);
      const height = Number(frame.attribs.height);
      return (width > 0 && width <= 2) || (height > 0 && height <= 2);
    },
    // No script, style, iframe, form, object/embed, or event handlers —
    // sanitize-html excludes these by default; we only extend the allow
    // list above, never re-add scripts/handlers.
  });
}
