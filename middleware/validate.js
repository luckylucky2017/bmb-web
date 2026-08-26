const validator = require("validator");

function clip(str, max) {
  return (str || "").toString().trim().slice(0, max);
}

function validateContact(req, res, next) {
  const name = clip(req.body.name, 191);
  const phone = clip(req.body.phone, 32);
  const email = clip(req.body.email, 191);
  const message = clip(req.body.message, 5000);

  if (!name || name.length < 2) {
    return res.status(400).send("Vui lòng nhập họ tên hợp lệ.");
  }
  if (!message) {
    return res.status(400).send("Vui lòng nhập nội dung liên hệ.");
  }
  if (email && !validator.isEmail(email)) {
    return res.status(400).send("Email không hợp lệ.");
  }
  if (phone && !validator.isMobilePhone(phone, "vi-VN") && !/^[0-9+\-\s()]{6,20}$/.test(phone)) {
    return res.status(400).send("Số điện thoại không hợp lệ.");
  }

  req.body.name = name;
  req.body.phone = phone;
  req.body.email = email;
  req.body.message = message;
  next();
}

function validateOrder(req, res, next) {
  const customer_name = clip(req.body.customer_name, 191);
  const phone = clip(req.body.phone, 32);
  const email = clip(req.body.email, 191);
  const address = clip(req.body.address, 255);
  const note = clip(req.body.note, 1000);
  const quantity = parseInt(req.body.quantity, 10);

  if (!customer_name || customer_name.length < 2) {
    return res.status(400).send("Vui lòng nhập họ tên hợp lệ.");
  }
  if (!phone || !(validator.isMobilePhone(phone, "vi-VN") || /^[0-9+\-\s()]{6,20}$/.test(phone))) {
    return res.status(400).send("Số điện thoại không hợp lệ.");
  }
  if (email && !validator.isEmail(email)) {
    return res.status(400).send("Email không hợp lệ.");
  }
  if (!address) {
    return res.status(400).send("Vui lòng nhập địa chỉ giao hàng.");
  }
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
    return res.status(400).send("Số lượng không hợp lệ.");
  }

  req.body.customer_name = customer_name;
  req.body.phone = phone;
  req.body.email = email;
  req.body.address = address;
  req.body.note = note;
  req.body.quantity = quantity;
  next();
}

function validateCartCheckout(req, res, next) {
  const customer_name = clip(req.body.customer_name, 191);
  const phone = clip(req.body.phone, 32);
  const email = clip(req.body.email, 191);
  const address = clip(req.body.address, 255);
  const note = clip(req.body.note, 1000);

  if (!customer_name || customer_name.length < 2) {
    return res.status(400).send("Vui lòng nhập họ tên hợp lệ.");
  }
  if (!phone || !(validator.isMobilePhone(phone, "vi-VN") || /^[0-9+\-\s()]{6,20}$/.test(phone))) {
    return res.status(400).send("Số điện thoại không hợp lệ.");
  }
  if (email && !validator.isEmail(email)) {
    return res.status(400).send("Email không hợp lệ.");
  }
  if (!address) {
    return res.status(400).send("Vui lòng nhập địa chỉ giao hàng.");
  }

  req.body.customer_name = customer_name;
  req.body.phone = phone;
  req.body.email = email;
  req.body.address = address;
  req.body.note = note;
  next();
}

module.exports = { validateContact, validateOrder, validateCartCheckout };
