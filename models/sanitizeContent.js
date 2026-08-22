const sanitizeHtml = require("sanitize-html");

// Matches the inline colors Quill's color/background pickers emit
// (hex or rgb()/rgba()) — anything else is stripped.
const COLOR_VALUE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/;

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
    "h2", "h3", "h4", "blockquote", "code", "pre", "img", "span", "iframe"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    span: ["class", "style"],
    p: ["class"],
    h2: ["class"],
    h3: ["class"],
    h4: ["class"],
    li: ["class"],
    blockquote: ["class"],
    // Video embeds: only the iframe shape Quill's video blot emits.
    iframe: ["src", "class", "frameborder", "allowfullscreen"]
  },
  allowedClasses: {
    "*": [/^ql-align-(center|right|justify)$/],
    iframe: ["ql-video"]
  },
  allowedStyles: {
    span: {
      color: [COLOR_VALUE],
      "background-color": [COLOR_VALUE]
    }
  },
  // Restrict embeddable video sources to trusted providers — an
  // arbitrary iframe src would otherwise be a clickjacking/XSS surface.
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" })
  }
};

function sanitizeContent(html) {
  return sanitizeHtml(html || "", SANITIZE_OPTIONS);
}

module.exports = sanitizeContent;
