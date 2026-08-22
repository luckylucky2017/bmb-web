const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Category = require("../../models/Category");
const upload = require("../../middleware/upload");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const posts = await Post.all();
    res.render("admin/posts/list", { title: "Tin tức | BMB Việt Nam CMS", posts });
  })
);

router.get(
  "/moi",
  asyncHandler(async (req, res) => {
    const categories = await Category.all({ type: "post" });
    res.render("admin/posts/form", { title: "Thêm bài viết | BMB Việt Nam CMS", post: null, categories });
  })
);

router.post(
  "/moi",
  upload.single("image_file"),
  asyncHandler(async (req, res) => {
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || "/images/news/news-1.svg";
      await Post.create({ ...req.body, image }, req.currentUser.id);
      req.flash("success", "Đã đăng bài viết mới.");
      res.redirect("/admin/tin-tuc");
    } catch (err) {
      req.flash("error", "Không thể tạo bài viết: " + err.message);
      res.redirect("/admin/tin-tuc/moi");
    }
  })
);

router.get(
  "/:id/sua",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Không tìm thấy bài viết");
    const categories = await Category.all({ type: "post" });
    res.render("admin/posts/form", { title: "Sửa bài viết | BMB Việt Nam CMS", post, categories });
  })
);

router.post(
  "/:id/sua",
  upload.single("image_file"),
  asyncHandler(async (req, res) => {
    try {
      const existing = await Post.findById(req.params.id);
      const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || existing.image;
      await Post.update(req.params.id, { ...req.body, image });
      req.flash("success", "Đã cập nhật bài viết.");
      res.redirect("/admin/tin-tuc");
    } catch (err) {
      req.flash("error", "Không thể cập nhật: " + err.message);
      res.redirect(`/admin/tin-tuc/${req.params.id}/sua`);
    }
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await Post.delete(req.params.id);
    req.flash("success", "Đã xoá bài viết.");
    res.redirect("/admin/tin-tuc");
  })
);

module.exports = router;
