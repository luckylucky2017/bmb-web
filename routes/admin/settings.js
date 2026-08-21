const express = require("express");
const router = express.Router();
const Setting = require("../../models/Setting");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await Setting.all();
    res.render("admin/settings", { title: "Cài đặt | BMB Việt Nam CMS", settings });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    await Setting.setMany(req.body);
    req.flash("success", "Đã lưu cài đặt.");
    res.redirect("/admin/cai-dat");
  })
);

module.exports = router;
