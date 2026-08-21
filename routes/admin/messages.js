const express = require("express");
const router = express.Router();
const ContactMessage = require("../../models/ContactMessage");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const messages = await ContactMessage.all();
    res.render("admin/messages/list", { title: "Liên hệ | BMB Việt Nam CMS", messages });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).send("Không tìm thấy");
    if (message.status === "new") await ContactMessage.updateStatus(message.id, "read");
    res.render("admin/messages/detail", { title: "Chi tiết liên hệ | BMB Việt Nam CMS", message });
  })
);

router.post(
  "/:id/trang-thai",
  asyncHandler(async (req, res) => {
    await ContactMessage.updateStatus(req.params.id, req.body.status);
    req.flash("success", "Đã cập nhật trạng thái.");
    res.redirect(`/admin/lien-he/${req.params.id}`);
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await ContactMessage.delete(req.params.id);
    req.flash("success", "Đã xoá liên hệ.");
    res.redirect("/admin/lien-he");
  })
);

module.exports = router;
