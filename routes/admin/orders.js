const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const asyncHandler = require("../../middleware/asyncHandler");

const STATUS_LABELS = {
  new: "Mới",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ"
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, q } = req.query;
    const orders = await Order.all({ status, q });
    res.render("admin/orders/list", {
      title: "Đơn hàng | BMB Việt Nam CMS",
      orders,
      statusLabels: STATUS_LABELS,
      currentStatus: status || "",
      q: q || ""
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Không tìm thấy đơn hàng");
    res.render("admin/orders/detail", {
      title: `Đơn hàng ${order.code} | BMB Việt Nam CMS`,
      order,
      statusLabels: STATUS_LABELS
    });
  })
);

router.post(
  "/:id/trang-thai",
  asyncHandler(async (req, res) => {
    await Order.updateStatus(req.params.id, req.body.status);
    req.flash("success", "Đã cập nhật trạng thái đơn hàng.");
    res.redirect(`/admin/don-hang/${req.params.id}`);
  })
);

router.post(
  "/:id/xoa",
  asyncHandler(async (req, res) => {
    await Order.delete(req.params.id);
    req.flash("success", "Đã xoá đơn hàng.");
    res.redirect("/admin/don-hang");
  })
);

module.exports = router;
