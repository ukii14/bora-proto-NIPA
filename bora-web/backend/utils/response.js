const ok = (data = null, message = "ok") => ({ ok: true, message, data });

const fail = (message = "error", data = null) => ({
  ok: false,
  message,
  data,
});

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

module.exports = { ok, fail, HttpError };
