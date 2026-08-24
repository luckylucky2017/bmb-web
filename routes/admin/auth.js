const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const svgCaptcha = require("svg-captcha");
const User = require("../../models/User");
const asyncHandler = require("../../middleware/asyncHandler");

// Per-IP throttle: blunt, fast brute-force/credential-stuffing sweeps.
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Quá nhiều lần đăng nhập từ địa chỉ này. Vui lòng thử lại sau 15 phút."
});

// Failed-attempt tracking is keyed by IP+email together, not email alone.
// Keying by email alone would let anyone who merely knows (or guesses) the
// admin email lock the real owner out of their own account from anywhere,
// without ever knowing the password — a free denial-of-service against a
// public-ish address like admin@bmbvietnam.vn. Keyed by IP+email, an
// attacker can only ever lock out *their own* IP's attempts; the real
// owner logging in from their usual network is unaffected. In-memory is
// fine for this single-process deployment.
const failedAttempts = new Map(); // "ip:email" -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
// After this many failures from the same IP+email, require solving a
// CAPTCHA before another password guess is even checked.
const CAPTCHA_AFTER_ATTEMPTS = 3;

function attemptKey(req, email) {
  return `${req.ip}:${email}`;
}

function isLocked(key) {
  const rec = failedAttempts.get(key);
  if (!rec) return false;
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true;
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    failedAttempts.delete(key);
  }
  return false;
}

function needsCaptcha(key) {
  const rec = failedAttempts.get(key);
  return !!rec && rec.count >= CAPTCHA_AFTER_ATTEMPTS;
}

function recordFailure(key) {
  const rec = failedAttempts.get(key) || { count: 0, lockedUntil: null };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
  }
  failedAttempts.set(key, rec);
}

function clearFailures(key) {
  failedAttempts.delete(key);
}

function renderCaptcha(req) {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 3,
    color: true,
    ignoreChars: "0oO1ilI", // visually ambiguous characters
    width: 150,
    height: 50
  });
  req.session.captchaText = captcha.text.toLowerCase();
  return captcha.data;
}

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/admin");
  const email = (req.query.email || "").trim().toLowerCase();
  const showCaptcha = email ? needsCaptcha(attemptKey(req, email)) : false;
  res.render("admin/login", {
    layout: false,
    title: "Đăng nhập quản trị | BMB Việt Nam",
    email,
    captchaSvg: showCaptcha ? renderCaptcha(req) : null
  });
});

router.get("/captcha-refresh", (req, res) => {
  res.type("image/svg+xml").send(renderCaptcha(req));
});

router.post(
  "/login",
  loginIpLimiter,
  asyncHandler(async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const captchaAnswer = (req.body.captcha || "").trim().toLowerCase();
    const key = attemptKey(req, email);

    if (isLocked(key)) {
      req.flash("error", "Đăng nhập từ địa chỉ này đang tạm khoá do sai nhiều lần. Vui lòng thử lại sau 15 phút.");
      return res.redirect(`/admin/login?email=${encodeURIComponent(email)}`);
    }

    if (needsCaptcha(key)) {
      const expected = req.session.captchaText;
      req.session.captchaText = null; // one-time use regardless of outcome
      if (!expected || captchaAnswer !== expected) {
        recordFailure(key);
        req.flash("error", "Mã xác nhận không đúng. Vui lòng thử lại.");
        return res.redirect(`/admin/login?email=${encodeURIComponent(email)}`);
      }
    }

    const user = await User.findByEmail(email);
    if (!user || !user.active || !User.verifyPassword(user, password)) {
      recordFailure(key);
      req.flash("error", "Email hoặc mật khẩu không đúng.");
      return res.redirect(`/admin/login?email=${encodeURIComponent(email)}`);
    }

    clearFailures(key);
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = user.id;
      res.redirect("/admin");
    });
  })
);

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
