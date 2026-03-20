const ApiError = require("../utils/ApiError");

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden: insufficient permissions");
    }
    next();
  };
}

module.exports = authorize;
