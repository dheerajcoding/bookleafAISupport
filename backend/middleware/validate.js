const ApiError = require("../utils/ApiError");

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ApiError(
        400,
        "Validation failed",
        error.details.map((item) => item.message),
      );
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
