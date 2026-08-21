const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const asyncHandler = require("../../middleware/asyncHandler");

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/admin");
  res.render("admin/login", { layout: false, title: "Đăng nhập quản trị | BMB Việt Nam" });
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findByEmail((email || "").trim().toLowerCase());
    if (!user || !user.active || !User.verifyPassword(user, password || "")) {
      req.flash("error", "Email hoặc mật khẩu không đúng.");
      return res.redirect("/admin/login");
    }
    req.session.userId = user.id;
    res.redirect("/admin");
  })
);

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
