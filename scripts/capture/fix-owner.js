"use strict";

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const ENV_PATH = path.resolve(__dirname, "../../bora-web/backend/.env");

(function loadEnv() {
  const raw = fs.readFileSync(ENV_PATH, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
})();

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const conn = mongoose.connection.useDb("bora");
  const Users = conn.collection("users");
  const Posts = conn.collection("blog_posts");

  const demo = await Users.findOne({ username: "demo" });
  if (!demo) throw new Error("demo 사용자를 찾을 수 없습니다.");

  const owner = {
    _id: demo._id,
    name: demo.name || "데모",
    username: demo.username,
  };
  const r = await Posts.updateMany({}, { $set: { user: owner } });
  console.log(`[fix-owner] demo=${demo._id} 로 ${r.modifiedCount}건 갱신`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
