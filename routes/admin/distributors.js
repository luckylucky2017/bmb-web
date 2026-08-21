const express = require("express");
const router = express.Router();
const Distributor = require("../../models/Distributor");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const distributors = await Distributor.all();
    res.render("admin/distributors/list", { title: "Đại lý | BMB Việt Nam CMS", distributors });
  })
);

router.get("/moi", (req, res) => {
  res.render("admin/distributors/form", { title: "Thêm đại lý | BMB Việt Nam CMS", distributor: null });
});

router.post(
  "/moi",
  asyncHandler(async (req, res) => {
    await Distributor.create(req.body);
    req.flash("success", "Đã thêm đại lý mới.");
    res.redirect("/admin/dai-ly");
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const distributor = await Distributor.findById(req.params.id);
    if (!distributor) return res.status(404).send("Không tìm thấy");
    res.render("admin/distributors/form", { title: "Sửa đại lý | BMB Việt Nam CMS", distributor });
  })
);

router.post(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    await Distributor.update(req.params.id, req.body);
    req.flash("success", "Đã cập nhật đại lý.");
    res.redirect("/admin/dai-ly");
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await Distributor.delete(req.params.id);
    req.flash("success", "Đã xoá đại lý.");
    res.redirect("/admin/dai-ly");
  })
);

module.exports = router;
