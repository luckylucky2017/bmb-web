const path = require("path");
const fs = require("fs");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

// Uploads are authenticated-only, but a compromised/malicious editor
// session could otherwise script unlimited 5MB uploads to fill disk —
// this caps that without affecting normal single-image form submits.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn tải ảnh lên quá nhiều lần. Vui lòng thử lại sau ít phút."
});

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

// SVG is intentionally excluded: it can carry embedded <script> and is a
// known stored-XSS vector when a browser is tricked into navigating to it
// directly (bypassing the safe <img> rendering context used elsewhere).
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, webp, gif)."));
    }
    cb(null, true);
  }
});

// The extension and Content-Type checked above are both entirely
// client-supplied and trivially spoofed (rename any file to .png, set the
// form field's mimetype to image/png). This checks the real file bytes
// against each format's magic number so a disguised non-image can never be
// stored and served back from our own domain.
const MAGIC_SIGNATURES = [
  { ext: [".jpg", ".jpeg"], bytes: [0xff, 0xd8, 0xff] },
  { ext: [".png"], bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: [".gif"], bytes: [0x47, 0x49, 0x46, 0x38] } // "GIF8", covers 87a/89a
];

function isValidWebp(buffer) {
  // RIFF <4-byte size> WEBP
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  );
}

function matchesSignature(buffer, ext) {
  if (ext === ".webp") return isValidWebp(buffer);
  const sig = MAGIC_SIGNATURES.find((s) => s.ext.includes(ext));
  if (!sig) return false;
  return sig.bytes.every((byte, i) => buffer[i] === byte);
}

// Throws if `file` (a multer file object) isn't really the image type its
// extension claims, deleting the bad upload from disk first. No-ops when
// `file` is undefined (route kept the previously-saved image, nothing new
// to check).
function assertValidImage(file) {
  if (!file) return;
  const ext = path.extname(file.filename).toLowerCase();
  let buffer = Buffer.alloc(0);
  try {
    const fd = fs.openSync(file.path, "r");
    buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
  } catch {
    // fall through with an empty buffer — treated as invalid below
  }
  if (!matchesSignature(buffer, ext)) {
    fs.unlink(file.path, () => {});
    throw new Error("File tải lên không phải ảnh hợp lệ.");
  }
}

// Promisified single-file upload so routes can `await` it inside their own
// try/catch alongside the rest of their logic (multer errors thrown by a
// plain middleware before the handler otherwise bypass that try/catch and
// fall through to the generic 500 page instead of the normal flash message).
function runUpload(fieldName) {
  const mw = upload.single(fieldName);
  return (req, res) =>
    new Promise((resolve, reject) => {
      mw(req, res, (err) => (err ? reject(err) : resolve()));
    });
}

module.exports = upload;
module.exports.assertValidImage = assertValidImage;
module.exports.runUpload = runUpload;
module.exports.uploadLimiter = uploadLimiter;
