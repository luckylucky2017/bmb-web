const express = require("express");
const router = express.Router();
const Category = require("../../models/Category");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const type = req.query.type === "post" ? "post" : "product";
    const categories = await Category.all({ type });
    res.render("admin/categories/list", { title: "Danh mục | BMB Việt Nam CMS", categories, type });
  })
);

router.get("/moi", (req, res) => {
  const type = req.query.type === "post" ? "post" : "product";
  res.render("admin/categories/form", { title: "Thêm danh mục | BMB Việt Nam CMS", category: null, type });
});

router.post(
  "/moi",
  asyncHandler(async (req, res) => {
    const type = req.body.type === "post" ? "post" : "product";
    try {
      await Category.create(req.body);
      req.flash("success", "Đã thêm danh mục mới.");
      res.redirect(`/admin/danh-muc?type=${type}`);
    } catch (err) {
      req.flash("error", "Không thể tạo danh mục (có thể trùng tên): " + err.message);
      res.redirect(`/admin/danh-muc/moi?type=${type}`);
    }
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send("Không tìm thấy danh mục");
    res.render("admin/categories/form", { title: "Sửa danh mục | BMB Việt Nam CMS", category, type: category.type });
  })
);

router.post(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const type = req.body.type === "post" ? "post" : "product";
    try {
      await Category.update(req.params.id, req.body);
      req.flash("success", "Đã cập nhật danh mục.");
      res.redirect(`/admin/danh-muc?type=${type}`);
    } catch (err) {
      req.flash("error", "Không thể cập nhật (có thể trùng tên): " + err.message);
      res.redirect(`/admin/danh-muc/${req.params.id}/sua`);
    }
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    await Category.delete(req.params.id);
    req.flash("success", "Đã xoá danh mục.");
    res.redirect(`/admin/danh-muc?type=${category ? category.type : "product"}`);
  })
);

module.exports = router;
