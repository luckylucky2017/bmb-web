const express = require("express");
const router = express.Router();
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const upload = require("../../middleware/upload");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await Product.all();
    res.render("admin/products/list", { title: "Sản phẩm | BMB Việt Nam CMS", products });
  })
);

router.get(
  "/moi",
  asyncHandler(async (req, res) => {
    const categories = await Category.all({ type: "product" });
    res.render("admin/products/form", { title: "Thêm sản phẩm | BMB Việt Nam CMS", product: null, categories });
  })
);

router.post("/upload-anh", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Không có ảnh nào được tải lên." });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post(
  "/moi",
  upload.single("image_file"),
  asyncHandler(async (req, res) => {
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || "/images/products/product-500.svg";
      await Product.create({ ...req.body, image });
      req.flash("success", "Đã thêm sản phẩm mới thành công.");
      res.redirect("/admin/san-pham");
    } catch (err) {
      req.flash("error", "Không thể tạo sản phẩm: " + err.message);
      res.redirect("/admin/san-pham/moi");
    }
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Không tìm thấy sản phẩm");
    const categories = await Category.all({ type: "product" });
    res.render("admin/products/form", { title: "Sửa sản phẩm | BMB Việt Nam CMS", product, categories });
  })
);

router.post(
  "/:id/sua",
  upload.single("image_file"),
  asyncHandler(async (req, res) => {
    try {
      const existing = await Product.findById(req.params.id);
      const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || existing.image;
      await Product.update(req.params.id, { ...req.body, image });
      req.flash("success", "Đã cập nhật sản phẩm.");
      res.redirect("/admin/san-pham");
    } catch (err) {
      req.flash("error", "Không thể cập nhật: " + err.message);
      res.redirect(`/admin/san-pham/${req.params.id}/sua`);
    }
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await Product.delete(req.params.id);
    req.flash("success", "Đã xoá sản phẩm.");
    res.redirect("/admin/san-pham");
  })
);

module.exports = router;
