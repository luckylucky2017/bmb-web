const validator = require("validator");

// Menu links and ad-banner links are free-text admin input rendered directly
// into href="..." — a scheme like javascript:/data: would execute on click
// even though EJS escapes the string (escaping stops HTML injection, not a
// dangerous URL scheme). Only allow same-site relative paths and http(s).
function isSafeUrl(url) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return validator.isURL(url, { protocols: ["http", "https"], require_protocol: true });
}

module.exports = isSafeUrl;
