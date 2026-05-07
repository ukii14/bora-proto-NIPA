// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status && Number.isInteger(err.status) ? err.status : 400;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    console.error("[errorHandler]", err);
  } else {
    console.warn("[errorHandler]", message);
  }

  res.status(status).json({ ok: false, message });
};

module.exports = { errorHandler };
