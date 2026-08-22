const express = require("express");
const router = express.Router();
const Setting = require("../../models/Setting");
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
  "theme"
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
  asyncHandler(async (req, res) => {
    const data = {};
    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        data[key] = String(req.body[key] || "").slice(0, 500);
      }
    }
    if (data.theme && !ALLOWED_THEMES.includes(data.theme)) {
      delete data.theme;
    }
    await Setting.setMany(data);
    req.flash("success", "Đã lưu cài đặt.");
    res.redirect("/admin/cai-dat");
  })
);

module.exports = router;
