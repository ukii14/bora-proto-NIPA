const multer = require("multer");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");

// 이미지 업로드
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) =>
    cb(null, `${uuid()}.${mime.extension(file.mimetype)}`),
});

// 이미지 필터
const mainContentUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg", "image/gif"].includes(file.mimetype))
      cb(null, true);
    else cb(new Error("invalid file type"), false);
  },
  limits: {
    fileSize: 1024 * 1024 * 20,
  },
});

module.exports = { mainContentUpload };
