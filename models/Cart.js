const Product = require("./Product");

const MAX_QTY = 999;

function getRaw(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}

const Cart = {
  add(req, productId, quantity) {
    const cart = getRaw(req);
    const id = String(productId);
    const qty = Math.max(1, Math.min(MAX_QTY, parseInt(quantity, 10) || 1));
    cart[id] = Math.min(MAX_QTY, (cart[id] || 0) + qty);
  },
  setQuantity(req, productId, quantity) {
    const cart = getRaw(req);
    const id = String(productId);
    const qty = Math.max(0, Math.min(MAX_QTY, parseInt(quantity, 10) || 0));
    if (qty === 0) delete cart[id];
    else cart[id] = qty;
  },
  remove(req, productId) {
    const cart = getRaw(req);
    delete cart[String(productId)];
  },
  clear(req) {
    req.session.cart = {};
  },
  count(req) {
    const cart = getRaw(req);
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  },
  async getItems(req) {
    const cart = getRaw(req);
    const ids = Object.keys(cart);
    if (!ids.length) return [];
    const items = [];
    for (const id of ids) {
      const product = await Product.findById(id);
      // Drop lines whose product was deleted/unpublished since it was
      // added — silently, rather than surfacing a broken cart row.
      if (!product || product.status !== "published") {
        delete cart[id];
        continue;
      }
      const quantity = cart[id];
      items.push({ product, quantity, lineTotal: product.price * quantity });
    }
    return items;
  },
  total(items) {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  }
};

module.exports = Cart;
