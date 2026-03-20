function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    details: err.details || undefined,
  });
}

module.exports = errorHandler;
