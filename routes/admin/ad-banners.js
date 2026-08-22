const express = require("express");
const fs = require("fs");
const router = express.Router();
const AdBanner = require("../../models/AdBanner");
const isSafeUrl = require("../../models/safeUrl");
const upload = require("../../middleware/upload");
const { assertValidImage, runUpload, uploadLimiter } = upload;
const uploadImageFile = runUpload("image_file");
const asyncHandler = require("../../middleware/asyncHandler");
const { requireRole } = require("../../middleware/auth");

router.use(requireRole("superadmin", "admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const position = req.query.position === "right" ? "right" : "left";
    const banners = await AdBanner.all({ position });
    res.render("admin/ad-banners/list", { title: "Quảng cáo 2 bên | BMB Việt Nam CMS", banners, position });
  })
);

router.get("/moi", (req, res) => {
  const position = req.query.position === "right" ? "right" : "left";
  res.render("admin/ad-banners/form", { title: "Thêm banner quảng cáo | BMB Việt Nam CMS", banner: null, position });
});

router.post(
  "/moi",
  uploadLimiter,
  asyncHandler(async (req, res) => {
    const position = req.body.position === "right" ? "right" : "left";
    try {
      await uploadImageFile(req, res);
      assertValidImage(req.file);
      if (req.body.link_url && !isSafeUrl(req.body.link_url)) {
        throw new Error("Đường dẫn liên kết không hợp lệ.");
      }
      if (!req.file && !req.body.image) {
        throw new Error("Vui lòng chọn ảnh banner.");
      }
      const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
      await AdBanner.create({ ...req.body, position, image });
      req.flash("success", "Đã thêm banner quảng cáo.");
      res.redirect(`/admin/quang-cao?position=${position}`);
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      req.flash("error", "Không thể tạo banner: " + err.message);
      res.redirect(`/admin/quang-cao/moi?position=${position}`);
    }
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const banner = await AdBanner.findById(req.params.id);
    if (!banner) return res.status(404).send("Không tìm thấy banner");
    res.render("admin/ad-banners/form", { title: "Sửa banner quảng cáo | BMB Việt Nam CMS", banner, position: banner.position });
  })
);

router.post(
  "/:id/sua",
  uploadLimiter,
  asyncHandler(async (req, res) => {
    try {
      await uploadImageFile(req, res);
      assertValidImage(req.file);
      if (req.body.link_url && !isSafeUrl(req.body.link_url)) {
        throw new Error("Đường dẫn liên kết không hợp lệ.");
      }
      const existing = await AdBanner.findById(req.params.id);
      const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || existing.image;
      await AdBanner.update(req.params.id, { ...req.body, image });
      req.flash("success", "Đã cập nhật banner.");
      res.redirect(`/admin/quang-cao?position=${req.body.position === "right" ? "right" : "left"}`);
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      req.flash("error", "Không thể cập nhật: " + err.message);
      res.redirect(`/admin/quang-cao/${req.params.id}/sua`);
    }
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    const banner = await AdBanner.findById(req.params.id);
    await AdBanner.delete(req.params.id);
    req.flash("success", "Đã xoá banner.");
    res.redirect(`/admin/quang-cao?position=${banner ? banner.position : "left"}`);
  })
);

module.exports = router;
