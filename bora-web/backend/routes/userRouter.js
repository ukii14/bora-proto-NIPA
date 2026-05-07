const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const userRouter = Router();
const { User, MainContent } = require("../models");
const { hash, compare } = require("bcryptjs");
const mongoose = require("mongoose");

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
});

// 회원가입
userRouter.post("/register", authLimiter, async (req, res) => {
  try {
    if (req.body.password.length < 6)
      throw new Error("비밀번호를 6자 이상으로 해주세요.");
    if (req.body.username.length < 3)
      throw new Error("username은 3자 이상으로 해주세요.");
    const hashedPassword = await hash(req.body.password, 10);
    const user = await new User({
      name: req.body.name,
      username: req.body.username,
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
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 로그인
const MAX_SESSIONS_PER_USER = 5;

userRouter.patch("/login", authLimiter, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) throw new Error("가입되지 않은 이메일입니다.");
    const isValid = await compare(req.body.password, user.hashedPassword);
    if (!isValid) throw new Error("입력하신 정보가 올바르지 않습니다.");
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
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// 로그아웃
userRouter.patch("/logout", async (req, res) => {
  try {
    // console.log(req.user);
    // 인증 코드 server\middleware\authentication.js 로 이사
    if (!req.user) throw new Error("invalid sessionid");
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { sessions: { _id: req.headers.sessionid } } }
    );
    res.json({ message: "user is logged out." });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// 내 권한 불러오기
userRouter.get("/me", (req, res) => {
  try {
    if (!req.user) throw new Error("권한이 없습니다.");
    res.json({
      message: "success",
      sessionId: req.headers.sessionid,
      name: req.user.name,
      userId: req.user._id,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// 본인들 mainContent만 불러오기
userRouter.get("/me/mainContents", async (req, res) => {
  try {
    const { lastid } = req.query;
    if (lastid && !mongoose.isValidObjectId(lastid))
      throw new Error("invalid lastid");
    if (!req.user) throw new Error("권한이 없습니다.");
    const mainContents = await MainContent.find(
      lastid
        ? { "user._id": req.user.id, _id: { $lt: lastid } }
        : { "user._id": req.user.id }
    )
      .sort({ _id: -1 })
      .limit(30);
    res.json(mainContents);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = { userRouter };
