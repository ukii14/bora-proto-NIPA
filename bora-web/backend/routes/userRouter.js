const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const userRouter = Router();
const { User, MainContent } = require("../models");
const { hash, compare } = require("bcryptjs");
const mongoose = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");
const { HttpError } = require("../utils/response");

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
});

const getRequiredString = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(`${fieldName}은(는) 필수입니다.`, 400);
  }
  return value.trim();
};

// 회원가입
userRouter.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const name = getRequiredString(req.body.name, "name");
    const username = getRequiredString(req.body.username, "username");
    const password = getRequiredString(req.body.password, "password");

    if (password.length < 6) {
      throw new HttpError("비밀번호를 6자 이상으로 해주세요.", 400);
    }
    if (username.length < 3) {
      throw new HttpError("username은 3자 이상으로 해주세요.", 400);
    }

    const hashedPassword = await hash(password, 10);
    const user = await new User({
      name,
      username,
      hashedPassword,
      sessions: [{ createdAt: new Date() }],
    }).save();
    const session = user.sessions[0];
    return res.json({
      message: "user registered",
      sessionId: session._id,
      name: user.name,
      userId: user._id,
    });
  })
);

// 로그인
const MAX_SESSIONS_PER_USER = 5;

userRouter.patch(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const username = getRequiredString(req.body.username, "username");
    const password = getRequiredString(req.body.password, "password");

    const user = await User.findOne({ username });
    if (!user) throw new HttpError("가입되지 않은 이메일입니다.", 401);

    const isValid = await compare(password, user.hashedPassword);
    if (!isValid) throw new HttpError("입력하신 정보가 올바르지 않습니다.", 401);

    user.sessions.push({ createdAt: new Date() });
    if (user.sessions.length > MAX_SESSIONS_PER_USER) {
      user.sessions = user.sessions.slice(-MAX_SESSIONS_PER_USER);
    }
    const session = user.sessions[user.sessions.length - 1];
    await user.save();

    res.json({
      message: "user validated",
      sessionId: session._id,
      name: user.name,
      userId: user._id,
    });
  })
);

// 로그아웃
userRouter.patch(
  "/logout",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("invalid sessionid", 401);

    await User.updateOne(
      { _id: req.user.id },
      { $pull: { sessions: { _id: req.headers.sessionid } } }
    );
    res.json({ message: "user is logged out." });
  })
);

// 내 권한 불러오기
userRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);
    res.json({
      message: "success",
      sessionId: req.headers.sessionid,
      name: req.user.name,
      userId: req.user._id,
    });
  })
);

// 본인들 mainContent만 불러오기
userRouter.get(
  "/me/mainContents",
  asyncHandler(async (req, res) => {
    const { lastid } = req.query;
    if (lastid && !mongoose.isValidObjectId(lastid)) {
      throw new HttpError("invalid lastid", 400);
    }
    if (!req.user) throw new HttpError("권한이 없습니다.", 401);

    const mainContents = await MainContent.find(
      lastid
        ? { "user._id": req.user.id, _id: { $lt: lastid } }
        : { "user._id": req.user.id }
    )
      .sort({ _id: -1 })
      .limit(30);
    res.json(mainContents);
  })
);

module.exports = { userRouter };
