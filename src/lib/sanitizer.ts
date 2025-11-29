import createDOMPurify from "isomorphic-dompurify";

type DomPurifyInstance = {
  sanitize: (source: string, config?: Record<string, unknown>) => string;
};

function resolvePurifier(): DomPurifyInstance {
  const candidate = createDOMPurify as unknown as DomPurifyInstance &
    ((window: Window) => DomPurifyInstance);

  if (typeof candidate.sanitize === "function") {
    return candidate;
  }

  if (typeof window === "undefined") {
    throw new Error("DOMPurify instance unavailable on server");
  }

  return (candidate as (window: Window) => DomPurifyInstance)(window);
}

const DOMPurify = resolvePurifier();

export function sanitizeHtml(input: string) {
  return DOMPurify.sanitize(input, {
    ADD_ATTR: ["style"],
    ALLOWED_TAGS: [
      "p",
      "span",
      "strong",
      "em",
      "u",
      "blockquote",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "img",
      "a",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "div",
      "section",
      "figure",
      "figcaption",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "style", "title"],
  });
}
