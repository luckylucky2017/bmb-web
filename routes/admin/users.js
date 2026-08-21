const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const { requireRole } = require("../../middleware/auth");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    const users = await User.all();
    res.render("admin/users/list", { title: "Người dùng | BMB Việt Nam CMS", users });
  })
);

router.get("/moi", requireRole("superadmin"), (req, res) => {
  res.render("admin/users/form", { title: "Thêm người dùng | BMB Việt Nam CMS", user: null });
});

router.post(
  "/moi",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    try {
      await User.create(req.body);
      req.flash("success", "Đã tạo tài khoản mới.");
      res.redirect("/admin/nguoi-dung");
    } catch (err) {
      req.flash("error", "Không thể tạo tài khoản: email có thể đã tồn tại.");
      res.redirect("/admin/nguoi-dung/moi");
    }
  })
);

router.get(
  "/:id/sua",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("Không tìm thấy");
    res.render("admin/users/form", { title: "Sửa người dùng | BMB Việt Nam CMS", user });
  })
);

router.post(
  "/:id/sua",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    await User.update(req.params.id, { ...req.body, active: req.body.active === "on" });
    req.flash("success", "Đã cập nhật tài khoản.");
    res.redirect("/admin/nguoi-dung");
  })
);

router.post(
  "/:id/xoa",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    if (parseInt(req.params.id, 10) === req.currentUser.id) {
      req.flash("error", "Bạn không thể tự xoá tài khoản của chính mình.");
      return res.redirect("/admin/nguoi-dung");
    }
    await User.delete(req.params.id);
    req.flash("success", "Đã xoá tài khoản.");
    res.redirect("/admin/nguoi-dung");
  })
);

module.exports = router;
