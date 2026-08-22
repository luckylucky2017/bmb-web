const sanitizeHtml = require("sanitize-html");

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
    "h2", "h3", "h4", "blockquote", "code", "pre", "img", "span"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    span: ["class"]
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" })
  }
};

function sanitizeContent(html) {
  return sanitizeHtml(html || "", SANITIZE_OPTIONS);
}

module.exports = sanitizeContent;
