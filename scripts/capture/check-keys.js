"use strict";

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const ENV_PATH = path.resolve(__dirname, "../../bora-web/backend/.env");
fs.readFileSync(ENV_PATH, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const Posts = mongoose.connection.useDb("bora").collection("blog_posts");
  const docs = await Posts.find({}, { projection: { title: 1, key: 1 } }).toArray();
  const counts = {};
  docs.forEach((d) => {
    counts[d.key] = (counts[d.key] || 0) + 1;
  });
  console.log("총 게시글:", docs.length);
  console.table(docs.map((d) => ({ title: d.title, key: d.key })));
  console.log("\nkey 별 사용 횟수:");
  console.table(Object.entries(counts).map(([k, v]) => ({ key: k, count: v })));
  await mongoose.disconnect();
})();
