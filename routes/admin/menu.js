const express = require("express");
const router = express.Router();
const MenuItem = require("../../models/MenuItem");
const isSafeUrl = require("../../models/safeUrl");
const asyncHandler = require("../../middleware/asyncHandler");
const { requireRole } = require("../../middleware/auth");

router.use(requireRole("superadmin", "admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await MenuItem.all();
    res.render("admin/menu/list", { title: "Menu điều hướng | BMB Việt Nam CMS", items });
  })
);

router.get("/moi", (req, res) => {
  res.render("admin/menu/form", { title: "Thêm mục menu | BMB Việt Nam CMS", item: null });
});

router.post(
  "/moi",
  asyncHandler(async (req, res) => {
    if (!isSafeUrl(req.body.url)) {
      req.flash("error", "Đường dẫn không hợp lệ — chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng /) hoặc http(s)://.");
      return res.redirect("/admin/menu/moi");
    }
    await MenuItem.create(req.body);
    req.flash("success", "Đã thêm mục menu.");
    res.redirect("/admin/menu");
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).send("Không tìm thấy mục menu");
    res.render("admin/menu/form", { title: "Sửa mục menu | BMB Việt Nam CMS", item });
  })
);

router.post(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    if (!isSafeUrl(req.body.url)) {
      req.flash("error", "Đường dẫn không hợp lệ — chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng /) hoặc http(s)://.");
      return res.redirect(`/admin/menu/${req.params.id}/sua`);
    }
    await MenuItem.update(req.params.id, req.body);
    req.flash("success", "Đã cập nhật mục menu.");
    res.redirect("/admin/menu");
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await MenuItem.delete(req.params.id);
    req.flash("success", "Đã xoá mục menu.");
    res.redirect("/admin/menu");
  })
);

module.exports = router;
