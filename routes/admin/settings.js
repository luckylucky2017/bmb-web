const express = require("express");
const router = express.Router();
const Setting = require("../../models/Setting");
const isSafeUrl = require("../../models/safeUrl");
const upload = require("../../middleware/upload");
const { assertValidImage, runUpload, uploadLimiter } = upload;
const uploadHeroImage = runUpload("hero_image_file");
const asyncHandler = require("../../middleware/asyncHandler");
const { requireRole } = require("../../middleware/auth");

const ALLOWED_KEYS = [
  "site_name",
  "company_full_name",
  "tagline",
  "hotline",
  "hotline_2",
  "email",
  "address",
  "address_2",
  "working_hours",
  "tax_code",
  "facebook_url",
  "zalo_url",
  "theme",
  "hero_title",
  "hero_subtitle",
  "hero_image",
  "hero_cta_text",
  "hero_cta_link",
  "hero_cta_text_2",
  "hero_cta_link_2"
];

const ALLOWED_THEMES = ["default", "tin-cay", "nang-dong"];

router.get(
  "/",
  requireRole("superadmin", "admin"),
  asyncHandler(async (req, res) => {
    const settings = await Setting.all();
    res.render("admin/settings", { title: "Cài đặt | BMB Việt Nam CMS", settings });
  })
);

router.post(
  "/",
  requireRole("superadmin", "admin"),
  uploadLimiter,
  asyncHandler(async (req, res) => {
    try {
      await uploadHeroImage(req, res);
      assertValidImage(req.file);
    } catch (err) {
      req.flash("error", "Không thể lưu ảnh banner: " + err.message);
      return res.redirect("/admin/cai-dat#banner");
    }

    const data = {};
    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        data[key] = String(req.body[key] || "").slice(0, 500);
      }
    }
    if (data.theme && !ALLOWED_THEMES.includes(data.theme)) {
      delete data.theme;
    }
    if (req.file) {
      data.hero_image = `/uploads/${req.file.filename}`;
    } else {
      delete data.hero_image; // keep the existing one — form doesn't resend it as a URL field
    }
    if (data.hero_cta_link && !isSafeUrl(data.hero_cta_link)) delete data.hero_cta_link;
    if (data.hero_cta_link_2 && !isSafeUrl(data.hero_cta_link_2)) delete data.hero_cta_link_2;

    await Setting.setMany(data);
    req.flash("success", "Đã lưu cài đặt.");
    res.redirect("/admin/cai-dat");
  })
);

module.exports = router;
