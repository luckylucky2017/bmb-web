const User = require("../models/User");

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect("/admin/login");
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.active) {
      req.session.destroy(() => {});
      return res.redirect("/admin/login");
    }
    req.currentUser = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      req.flash("error", "Bạn không có quyền truy cập chức năng này.");
      return res.redirect("/admin");
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
