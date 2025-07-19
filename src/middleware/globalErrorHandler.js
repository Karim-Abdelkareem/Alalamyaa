export default (err, req, res, next) => {
  console.error("Global Error Handler:", err.stack || err);
  if (typeof err === 'string') {
    err = new Error(err);
  }
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
