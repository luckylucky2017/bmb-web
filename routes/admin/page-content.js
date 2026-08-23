const express = require("express");
const router = express.Router();
const Setting = require("../../models/Setting");
const asyncHandler = require("../../middleware/asyncHandler");
const { requireRole } = require("../../middleware/auth");

const ALLOWED_KEYS = [
  "home_whyus_title",
  "about_page_title",
  "about_page_subtitle",
  "about_intro_title",
  "about_intro_paragraph_1",
  "about_intro_paragraph_2",
  "about_stat_1_value",
  "about_stat_1_label",
  "about_stat_2_value",
  "about_stat_2_label",
  "contact_page_title",
  "contact_page_subtitle",
  "contact_section_title",
  "contact_form_title",
  "contact_form_subtitle",
  "sustain_page_title",
  "sustain_page_subtitle",
  "sustain_card_1_title",
  "sustain_card_1_desc",
  "sustain_card_2_title",
  "sustain_card_2_desc",
  "sustain_card_3_title",
  "sustain_card_3_desc",
  "sustain_community_title",
  "sustain_community_text"
];

router.use(requireRole("superadmin", "admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await Setting.all();
    res.render("admin/page-content", { title: "Nội dung trang | BMB Việt Nam CMS", settings });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = {};
    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        data[key] = String(req.body[key] || "").slice(0, 1000);
      }
    }
    await Setting.setMany(data);
    req.flash("success", "Đã lưu nội dung trang.");
    res.redirect("/admin/noi-dung-trang");
  })
);

module.exports = router;
