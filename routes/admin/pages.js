const express = require("express");
const router = express.Router();
const Page = require("../../models/Page");
const upload = require("../../middleware/upload");
const { assertValidImage, uploadLimiter } = upload;
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pages = await Page.all();
    res.render("admin/pages/list", { title: "Trang tuỳ chỉnh | BMB Việt Nam CMS", pages });
  })
);

router.get("/moi", (req, res) => {
  res.render("admin/pages/form", { title: "Thêm trang | BMB Việt Nam CMS", page: null });
});

router.post("/upload-anh", uploadLimiter, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Không có ảnh nào được tải lên." });
    try {
      assertValidImage(req.file);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post(
  "/moi",
  asyncHandler(async (req, res) => {
    try {
      await Page.create(req.body);
      req.flash("success", "Đã tạo trang mới.");
      res.redirect("/admin/trang");
    } catch (err) {
      req.flash("error", "Không thể tạo trang (có thể trùng đường dẫn): " + err.message);
      res.redirect("/admin/trang/moi");
    }
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).send("Không tìm thấy trang");
    res.render("admin/pages/form", { title: "Sửa trang | BMB Việt Nam CMS", page });
  })
);

router.post(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    try {
      await Page.update(req.params.id, req.body);
      req.flash("success", "Đã cập nhật trang.");
      res.redirect("/admin/trang");
    } catch (err) {
      req.flash("error", "Không thể cập nhật (có thể trùng đường dẫn): " + err.message);
      res.redirect(`/admin/trang/${req.params.id}/sua`);
    }
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await Page.delete(req.params.id);
    req.flash("success", "Đã xoá trang.");
    res.redirect("/admin/trang");
  })
);

module.exports = router;
