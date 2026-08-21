const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
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

function isLocked(email) {
  const rec = failedAttempts.get(email);
  if (!rec) return false;
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true;
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    failedAttempts.delete(email);
  }
  return false;
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

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/admin");
  res.render("admin/login", { layout: false, title: "Đăng nhập quản trị | BMB Việt Nam" });
});

router.post(
  "/login",
  loginIpLimiter,
  asyncHandler(async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (isLocked(email)) {
      req.flash("error", "Tài khoản tạm khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.");
      return res.redirect("/admin/login");
    }

    const user = await User.findByEmail(email);
    if (!user || !user.active || !User.verifyPassword(user, password)) {
      recordFailure(email);
      req.flash("error", "Email hoặc mật khẩu không đúng.");
      return res.redirect("/admin/login");
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
