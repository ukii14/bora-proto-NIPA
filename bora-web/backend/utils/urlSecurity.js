const { HttpError } = require("./response");

const MAX_URL_LENGTH = 2048;

/**
 * http(s)만 허용. new URL로 파싱해 javascript:, data: 등 차단.
 */
function assertHttpUrl(raw, fieldName = "web_link") {
  if (typeof raw !== "string") {
    throw new HttpError(`${fieldName} 형식이 올바르지 않습니다.`, 400);
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new HttpError(`${fieldName}은(는) 비어 있을 수 없습니다.`, 400);
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new HttpError(`${fieldName}이(가) 너무 깁니다.`, 400);
  }
  let u;
  try {
    u = new URL(trimmed);
  } catch {
    throw new HttpError(
      `${fieldName}은(는) 유효한 http(s) URL이어야 합니다.`,
      400
    );
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new HttpError(
      `${fieldName}은(는) http 또는 https만 허용됩니다.`,
      400
    );
  }
  if (!u.hostname) {
    throw new HttpError(`${fieldName}에 호스트가 필요합니다.`, 400);
  }
  return trimmed;
}

/** 업로드 등: 비어 있으면 빈 문자열, 있으만 검증 */
function normalizeOptionalHttpUrl(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return assertHttpUrl(s, "web_link");
}

module.exports = {
  assertHttpUrl,
  normalizeOptionalHttpUrl,
  MAX_URL_LENGTH,
};
