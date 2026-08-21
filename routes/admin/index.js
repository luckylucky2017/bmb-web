const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../middleware/auth");
const asyncHandler = require("../../middleware/asyncHandler");
const Order = require("../../models/Order");
const ContactMessage = require("../../models/ContactMessage");

router.use("/", require("./auth"));

router.use(requireAuth);
router.use(
  asyncHandler(async (req, res, next) => {
    res.locals.layout = "admin/layout";
    res.locals.activeNav = req.path.split("/")[1] || "";
    res.locals.newOrdersCount = await Order.count({ status: "new" });
    res.locals.newMessagesCount = await ContactMessage.count({ status: "new" });
    next();
  })
);

router.use("/", require("./dashboard"));
router.use("/san-pham", require("./products"));
router.use("/tin-tuc", require("./posts"));
router.use("/dai-ly", require("./distributors"));
router.use("/tuyen-dung", require("./jobs"));
router.use("/don-hang", require("./orders"));
router.use("/lien-he", require("./messages"));
router.use("/cai-dat", require("./settings"));
router.use("/nguoi-dung", require("./users"));
router.use("/tai-khoan", require("./profile"));

module.exports = router;
