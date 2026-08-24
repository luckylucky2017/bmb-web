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

// Per-account lockout: stops password-guessing against one email even
// from rotating IPs. In-memory is fine for this single-process deployment.
const failedAttempts = new Map(); // email -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
// After this many failures, a scripted credential-stuffing attempt is the
// working assumption — require solving a CAPTCHA before another password
// guess is even checked, regardless of which IP it comes from next.
const CAPTCHA_AFTER_ATTEMPTS = 3;

function isLocked(email) {
  const rec = failedAttempts.get(email);
  if (!rec) return false;
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true;
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    failedAttempts.delete(email);
  }
  return false;
}

function needsCaptcha(email) {
  const rec = failedAttempts.get(email);
  return !!rec && rec.count >= CAPTCHA_AFTER_ATTEMPTS;
}

function recordFailure(email) {
  const rec = failedAttempts.get(email) || { count: 0, lockedUntil: null };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
  }
  failedAttempts.set(email, rec);
}

function clearFailures(email) {
  failedAttempts.delete(email);
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
  const showCaptcha = needsCaptcha(email);
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

    if (isLocked(email)) {
      req.flash("error", "Tài khoản tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.");
      return res.redirect("/admin/login");
    }

    if (needsCaptcha(email)) {
      const expected = req.session.captchaText;
      req.session.captchaText = null; // one-time use regardless of outcome
      if (!expected || captchaAnswer !== expected) {
        recordFailure(email);
        req.flash("error", "Mã xác nhận không đúng. Vui lòng thử lại.");
        return res.redirect(`/admin/login?email=${encodeURIComponent(email)}`);
      }
    }

    const user = await User.findByEmail(email);
    if (!user || !user.active || !User.verifyPassword(user, password)) {
      recordFailure(email);
      req.flash("error", "Email hoặc mật khẩu không đúng.");
      return res.redirect(`/admin/login?email=${encodeURIComponent(email)}`);
    }

    clearFailures(email);
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
