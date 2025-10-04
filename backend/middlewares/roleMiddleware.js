// middlewares/roleMiddleware.js
module.exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Access Denied. Admin privileges required.",
    });
  }
  next();
};

module.exports.isManager = (req, res, next) => {
  if (!req.user || req.user.role !== "Manager") {
    return res.status(403).json({
      success: false,
      message: "Access Denied. Manager privileges required.",
    });
  }
  next();
};

module.exports.isAdminOrManager = (req, res, next) => {
  const { role } = req.user || {};
  if (role === "Admin" || role === "Manager") return next();

  return res.status(403).json({
    success: false,
    message: "Access Denied. Insufficient permissions.",
  });
};
