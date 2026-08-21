const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const asyncHandler = require("../../middleware/asyncHandler");

router.get("/", (req, res) => {
  res.render("admin/profile", { title: "Tài khoản của tôi | BMB Việt Nam CMS" });
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = { name: req.body.name, email: req.body.email, role: req.currentUser.role, active: true };
    if (req.body.password) data.password = req.body.password;
    await User.update(req.currentUser.id, data);
    req.flash("success", "Đã cập nhật thông tin tài khoản.");
    res.redirect("/admin/tai-khoan");
  })
);

module.exports = router;
