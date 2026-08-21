const express = require("express");
const router = express.Router();
const Product = require("../../models/Product");
const Post = require("../../models/Post");
const Order = require("../../models/Order");
const ContactMessage = require("../../models/ContactMessage");
const asyncHandler = require("../../middleware/asyncHandler");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [
      productsCount,
      productsPublished,
      postsCount,
      postsPublished,
      ordersCount,
      ordersNew,
      revenue,
      messagesNew,
      recentOrders,
      recentMessages,
      recentPosts
    ] = await Promise.all([
      Product.count(),
      Product.count({ status: "published" }),
      Post.count(),
      Post.count({ status: "published" }),
      Order.count(),
      Order.count({ status: "new" }),
      Order.revenueSum(),
      ContactMessage.count({ status: "new" }),
      Order.all(),
      ContactMessage.all(),
      Post.all({ limit: 5 })
    ]);

    const stats = {
      products: productsCount,
      productsPublished,
      posts: postsCount,
      postsPublished,
      orders: ordersCount,
      ordersNew,
      revenue,
      messagesNew
    };

    res.render("admin/dashboard", {
      title: "Bảng điều khiển | BMB Việt Nam CMS",
      stats,
      recentOrders: recentOrders.slice(0, 6),
      recentMessages: recentMessages.slice(0, 5),
      recentPosts
    });
  })
);

module.exports = router;
