const express = require("express");
const router = express.Router();
const Job = require("../../models/Job");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const jobs = await Job.all();
    res.render("admin/jobs/list", { title: "Tuyển dụng | BMB Việt Nam CMS", jobs });
  })
);

router.get("/moi", (req, res) => {
  res.render("admin/jobs/form", { title: "Thêm vị trí tuyển dụng | BMB Việt Nam CMS", job: null });
});

router.post(
  "/moi",
  asyncHandler(async (req, res) => {
    await Job.create(req.body);
    req.flash("success", "Đã thêm vị trí tuyển dụng.");
    res.redirect("/admin/tuyen-dung");
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).send("Không tìm thấy");
    res.render("admin/jobs/form", { title: "Sửa vị trí tuyển dụng | BMB Việt Nam CMS", job });
  })
);

router.post(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    await Job.update(req.params.id, req.body);
    req.flash("success", "Đã cập nhật vị trí tuyển dụng.");
    res.redirect("/admin/tuyen-dung");
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await Job.delete(req.params.id);
    req.flash("success", "Đã xoá vị trí tuyển dụng.");
    res.redirect("/admin/tuyen-dung");
  })
);

module.exports = router;
