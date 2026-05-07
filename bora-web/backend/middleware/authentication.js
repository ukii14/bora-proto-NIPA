const mongoose = require("mongoose");
const { User } = require("../models");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const authenticate = async (req, res, next) => {
  try {
    const { sessionid } = req.headers;
    if (!sessionid || !mongoose.isValidObjectId(sessionid)) return next();

    const user = await User.findOne({ "sessions._id": sessionid });
    if (!user) return next();

    const session = user.sessions.id(sessionid);
    if (!session) return next();

    const age = Date.now() - new Date(session.createdAt).getTime();
    if (age > SESSION_TTL_MS) {
      await User.updateOne(
        { _id: user._id },
        { $pull: { sessions: { _id: sessionid } } }
      );
      return res.status(401).json({ ok: false, message: "세션이 만료되었습니다." });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { authenticate };
