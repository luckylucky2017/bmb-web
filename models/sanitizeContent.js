const sanitizeHtml = require("sanitize-html");

// Value allow-lists for the inline styles the editor (TinyMCE) emits —
// anything not matching these patterns is stripped, not just filtered by tag.
const COLOR_VALUE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/;
const FONT_FAMILY_VALUE = /^[a-zA-Z0-9\s,'"-]+$/;
const FONT_SIZE_VALUE = /^\d{1,3}(\.\d+)?(px|pt|em|%)$/;
const TEXT_ALIGN_VALUE = /^(left|center|right|justify)$/;
const DIMENSION_VALUE = /^\d{1,4}(\.\d+)?(px|%)?$/;
const FLOAT_VALUE = /^(left|right|none)$/;
const DISPLAY_VALUE = /^(block|inline-block|inline)$/;
const VERTICAL_ALIGN_VALUE = /^(top|middle|bottom|baseline)$/;
const MARGIN_TOKEN = "(auto|0|\\d{1,4}(\\.\\d+)?(px|em|%))";
const MARGIN_VALUE = new RegExp(`^${MARGIN_TOKEN}(\\s+${MARGIN_TOKEN}){0,3}$`);

const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "li", "blockquote", "td", "th", "table"];

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "blockquote", "code", "pre", "img", "span", "iframe",
    "table", "colgroup", "col", "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "style"],
    span: ["class", "style"],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    li: ["style"],
    blockquote: ["style"],
    table: ["style", "border"],
    col: ["style"],
    td: ["style", "colspan", "rowspan"],
    th: ["style", "colspan", "rowspan"],
    // Video embeds: only the iframe shape our video embed feature emits.
    iframe: ["src", "class", "frameborder", "allowfullscreen", "style", "width", "height"]
  },
  allowedStyles: {
    span: {
      color: [COLOR_VALUE],
      "background-color": [COLOR_VALUE],
      "font-family": [FONT_FAMILY_VALUE],
      "font-size": [FONT_SIZE_VALUE]
    },
    img: {
      width: [DIMENSION_VALUE],
      height: [DIMENSION_VALUE],
      "max-width": [DIMENSION_VALUE],
      float: [FLOAT_VALUE],
      display: [DISPLAY_VALUE],
      "vertical-align": [VERTICAL_ALIGN_VALUE],
      margin: [MARGIN_VALUE],
      "margin-left": [MARGIN_VALUE],
      "margin-right": [MARGIN_VALUE],
      "margin-top": [MARGIN_VALUE],
      "margin-bottom": [MARGIN_VALUE]
    },
    col: {
      width: [DIMENSION_VALUE]
    },
    iframe: {
      float: [FLOAT_VALUE],
      display: [DISPLAY_VALUE],
      margin: [MARGIN_VALUE],
      "margin-left": [MARGIN_VALUE],
      "margin-right": [MARGIN_VALUE],
      "margin-top": [MARGIN_VALUE],
      "margin-bottom": [MARGIN_VALUE],
      "max-width": [DIMENSION_VALUE]
    },
    ...Object.fromEntries(
      BLOCK_TAGS.map((tag) => [
        tag,
        tag === "table"
          ? { "text-align": [TEXT_ALIGN_VALUE], width: [DIMENSION_VALUE], "border-collapse": [/^collapse$/] }
          : { "text-align": [TEXT_ALIGN_VALUE] }
      ])
    )
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
